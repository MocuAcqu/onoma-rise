import type * as Tone from "tone";

type ScheduledNote = {
  name: string;
  midi: number;
  duration: number;
  velocity: number;
  release?: number;
};

type PendingBatch = {
  notes: ScheduledNote[];
  offsetSec: number;
  minimumDurationSec: number;
};

type PianoVoice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

// Keep the recorded piano tail long enough to decay naturally. This value is
// deliberately stable at faster playback speeds; cubic release compression
// made every note sound abruptly braked at 1.25x and 1.5x.
const DEFAULT_RELEASE = 0.22;
// Add one final decibel of pre-gain (about 12% more amplitude), while the
// limiter continues to catch strong multi-note chord peaks.
const MASTER_GAIN = 10 ** (6 / 20);
const LIMITER_THRESHOLD_DB = -1;
const LIMITER_RATIO = 20;
const CANCEL_FADE = 0.008;
const SOURCE_STOP_PADDING = 0.005;

/**
 * Convert the score's normalized expressive velocity into Web Audio gain.
 *
 * Sampled instruments commonly produce RMS amplitude approximately in
 * proportion to squared MIDI velocity. Applying that curve here makes written
 * dynamics audible without changing the score-analysis rules themselves.
 */
export function pianoVelocityToGain(velocity: number): number {
  const normalizedVelocity = Math.min(1, Math.max(0, velocity));
  return normalizedVelocity ** 2;
}

// Use a note every minor third so the player only needs a small local download
// while keeping pitch shifting between neighbouring samples subtle.
const PIANO_SAMPLES = new Map<number, string>([
  [21, "A0.mp3"],
  [24, "C1.mp3"],
  [27, "Ds1.mp3"],
  [30, "Fs1.mp3"],
  [33, "A1.mp3"],
  [36, "C2.mp3"],
  [39, "Ds2.mp3"],
  [42, "Fs2.mp3"],
  [45, "A2.mp3"],
  [48, "C3.mp3"],
  [51, "Ds3.mp3"],
  [54, "Fs3.mp3"],
  [57, "A3.mp3"],
  [60, "C4.mp3"],
  [63, "Ds4.mp3"],
  [66, "Fs4.mp3"],
  [69, "A4.mp3"],
  [72, "C5.mp3"],
  [75, "Ds5.mp3"],
  [78, "Fs5.mp3"],
  [81, "A5.mp3"],
  [84, "C6.mp3"],
  [87, "Ds6.mp3"],
  [90, "Fs6.mp3"],
  [93, "A6.mp3"],
  [96, "C7.mp3"],
]);

const SAMPLE_BASE_URL = `${import.meta.env.BASE_URL}assets/sounds/salamander/`;

function closestSampleMidi(midi: number) {
  let closest = 60;
  let distance = Infinity;
  for (const sampleMidi of PIANO_SAMPLES.keys()) {
    const candidateDistance = Math.abs(sampleMidi - midi);
    if (candidateDistance < distance) {
      closest = sampleMidi;
      distance = candidateDistance;
    }
  }
  return closest;
}

/**
 * Sample player dedicated to recognized-score playback.
 *
 * Each note owns its AudioBufferSourceNode and gain envelope. Keeping those
 * voices under our control is important: Tone.Sampler removes a voice from its
 * active list as soon as it schedules a future note-off, so releaseAll() cannot
 * reliably stop that still-audible voice when the user pauses or starts over.
 */
export class ScorePianoEngine {
  private _tonePromise: Promise<typeof Tone> | null = null;
  private _initPromise: Promise<void> | null = null;
  private _context: AudioContext | null = null;
  private _master: GainNode | null = null;
  private _limiter: DynamicsCompressorNode | null = null;
  private _buffers = new Map<number, AudioBuffer>();
  private _voices = new Set<PianoVoice>();
  private _pendingBatches: PendingBatch[] = [];
  private _playbackOrigin: number | null = null;
  private _generation = 0;

  private loadTone(): Promise<typeof Tone> {
    if (!this._tonePromise) this._tonePromise = import("tone");
    return this._tonePromise;
  }

  private initSamples(tone: typeof Tone): Promise<void> {
    if (this._buffers.size === PIANO_SAMPLES.size && this._master && this._limiter) {
      return Promise.resolve();
    }
    if (this._initPromise) return this._initPromise;

    const generation = this._generation;
    const context = tone.getContext().rawContext as AudioContext;
    this._context = context;
    this._master = context.createGain();
    this._master.gain.value = MASTER_GAIN;
    this._limiter = context.createDynamicsCompressor();
    this._limiter.threshold.value = LIMITER_THRESHOLD_DB;
    this._limiter.knee.value = 0;
    this._limiter.ratio.value = LIMITER_RATIO;
    this._limiter.attack.value = 0.002;
    this._limiter.release.value = 0.1;
    this._master.connect(this._limiter);
    this._limiter.connect(context.destination);

    this._initPromise = Promise.all(
      [...PIANO_SAMPLES].map(async ([midi, filename]) => {
        const response = await fetch(`${SAMPLE_BASE_URL}${filename}`);
        if (!response.ok) {
          throw new Error(`Unable to load piano sample: ${filename}`);
        }
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        return [midi, buffer] as const;
      }),
    ).then((samples) => {
      if (generation !== this._generation) return;
      this._buffers = new Map(samples);
    }).catch((error: unknown) => {
      if (generation === this._generation) {
        this._buffers.clear();
        this._master?.disconnect();
        this._limiter?.disconnect();
        this._master = null;
        this._limiter = null;
        this._context = null;
        this._initPromise = null;
      }
      throw error;
    });
    return this._initPromise;
  }

  async ensureStarted(): Promise<void> {
    // Resume Web Audio from the playback click before awaiting sample decoding,
    // preserving the browser's user-gesture permission.
    const tone = await this.loadTone();
    if (tone.getContext().state !== "running") await tone.start();
    await this.initSamples(tone);
  }

  prepareScheduledPlayback(_speed = 1): void {
    this.cancelScheduledPlayback();
  }

  scheduleNoteBatch(
    notes: ScheduledNote[],
    offsetSec: number,
    minimumDurationSec: number,
  ): void {
    const batch = { notes, offsetSec, minimumDurationSec };
    if (this._playbackOrigin === null) {
      this._pendingBatches.push(batch);
      return;
    }
    this.scheduleBatch(batch, this._playbackOrigin);
  }

  private scheduleBatch(batch: PendingBatch, origin: number): void {
    const context = this._context;
    const master = this._master;
    if (!context || !master) return;
    const startTime = origin + Math.max(0, batch.offsetSec);

    for (const note of batch.notes) {
      const sampleMidi = closestSampleMidi(note.midi);
      const buffer = this._buffers.get(sampleMidi);
      if (!buffer) continue;

      const source = context.createBufferSource();
      const gain = context.createGain();
      const release = note.release ?? DEFAULT_RELEASE;
      const duration = note.release === undefined
        ? Math.max(batch.minimumDurationSec, note.duration)
        : Math.max(0.005, note.duration);
      const releaseStart = startTime + duration;
      const releaseEnd = releaseStart + release;
      const noteGain = pianoVelocityToGain(note.velocity);

      source.buffer = buffer;
      source.playbackRate.value = 2 ** ((note.midi - sampleMidi) / 12);
      gain.gain.value = 0;
      gain.gain.setValueAtTime(noteGain, startTime);
      gain.gain.setValueAtTime(noteGain, releaseStart);
      gain.gain.linearRampToValueAtTime(0, releaseEnd);
      source.connect(gain);
      gain.connect(master);

      const voice = { source, gain };
      this._voices.add(voice);
      source.onended = () => {
        this._voices.delete(voice);
        source.disconnect();
        gain.disconnect();
      };
      source.start(startTime);
      source.stop(releaseEnd + SOURCE_STOP_PADDING);
    }
  }

  startScheduledPlayback(delaySec = 0.03): number {
    const context = this._context;
    if (!context) return 0;
    const origin = context.currentTime + Math.max(0, delaySec);
    this._playbackOrigin = origin;
    const pending = this._pendingBatches;
    this._pendingBatches = [];
    for (const batch of pending) this.scheduleBatch(batch, origin);
    return origin;
  }

  cancelScheduledPlayback(): void {
    this._pendingBatches = [];
    this._playbackOrigin = null;
    const context = this._context;
    if (!context) {
      this._voices.clear();
      return;
    }

    const now = context.currentTime;
    for (const voice of this._voices) {
      try {
        voice.gain.gain.cancelAndHoldAtTime(now);
        voice.gain.gain.linearRampToValueAtTime(0, now + CANCEL_FADE);
        voice.source.stop(now + CANCEL_FADE + SOURCE_STOP_PADDING);
      } catch {
        // A voice that ended between iteration and stop needs no further work.
      }
    }
    this._voices.clear();
  }

  dispose(): void {
    this.cancelScheduledPlayback();
    this._generation += 1;
    this._master?.disconnect();
    this._limiter?.disconnect();
    this._master = null;
    this._limiter = null;
    this._context = null;
    this._buffers.clear();
    this._tonePromise = null;
    this._initPromise = null;
  }

  now(): number {
    return this._context?.currentTime ?? 0;
  }
}
