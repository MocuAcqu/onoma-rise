import type * as Tone from "tone";
import PitchUtils from "./PitchUtils";
import type { PitchClass } from "../type";

export class AudioEngine {
  private _synth: Tone.PolySynth<Tone.Synth> | null = null;
  private _active : Set<string>;
  private _activePCs: Set<PitchClass>;
  private _Tone: typeof Tone | null = null;
  private _initPromise: Promise<void> | null = null;
  private _generation = 0;
  private _transportEvents = new Set<number>();

  constructor() {
    this._synth = null;
    this._active = new Set<string>();       // active note strings
    this._activePCs = new Set<PitchClass>();    // active pitch classes
  }

  init(): Promise<void> {
    if (this._synth) return Promise.resolve();
    if (this._initPromise) return this._initPromise;

    const generation = this._generation;
    this._initPromise = import("tone").then((tone) => {
      if (generation !== this._generation) return;
      this._Tone = tone;
      this._synth = new tone.PolySynth(tone.Synth, {
        envelope: {
          attack: 0.001,
          decay: 0.04,
          sustain: 0.55,
          release: 0.12,
        },
      }).toDestination();
      // Dense piano passages can keep many voices in their release tail at
      // once. Tone drops new notes when this limit is reached.
      this._synth.maxPolyphony = 64;
      this._synth.volume.value = -10;
    });
    return this._initPromise;
  }

  dispose(): void {
    this.cancelScheduledPlayback();
    this._generation += 1;
    this._synth?.dispose();
    this._synth = null;
    this._Tone = null;
    this._initPromise = null;
    this._active.clear();
    this._activePCs.clear();
  }

  async ensureStarted() :Promise<void>{
    await this.init();
    if (this._Tone && this._Tone.context.state !== "running") {
      await this._Tone.start();
    }
  }

  /** Returns false if note already active */
  attack(pitch:PitchClass, octave:number, velocity:number = 0.7):boolean {
    const note = PitchUtils.buildNote(pitch, octave);
    if (this._active.has(note)) return false;
    this._active.add(note);
    this._activePCs.add(pitch);
    this._synth?.triggerAttack(note, undefined, velocity);
    return true;
  }

  release(pitch:PitchClass, octave:number):boolean {
    const note = PitchUtils.buildNote(pitch, octave);
    if (!this._active.has(note)) return false;
    this._active.delete(note);
    this._activePCs.delete(pitch);
    this._synth?.triggerRelease(note);
    return true;
  }

  attackRelease(
    notes: string | string[],
    durationSec: number,
    velocity: number = 0.7,
    startTime: number = this.now(),
  ): void {
    this._synth?.triggerAttackRelease(notes, durationSec, startTime, velocity);
  }

  prepareScheduledPlayback(): void {
    const transport = this._Tone?.getTransport();
    if (!transport) return;
    transport.stop();
    transport.cancel(0);
    transport.loop = false;
    transport.seconds = 0;
    this._transportEvents.clear();
    this._synth?.releaseAll(this.now());
  }

  scheduleAttackRelease(
    note: string,
    offsetSec: number,
    durationSec: number,
    velocity: number,
  ): void {
    const transport = this._Tone?.getTransport();
    if (!transport || !this._synth) return;
    let eventId = 0;
    eventId = transport.scheduleOnce((time) => {
      this._transportEvents.delete(eventId);
      this._synth?.triggerAttackRelease(
        note,
        Math.max(0.025, durationSec),
        time,
        velocity,
      );
    }, Math.max(0, offsetSec));
    this._transportEvents.add(eventId);
  }

  startScheduledPlayback(delaySec = 0.03): void {
    const transport = this._Tone?.getTransport();
    if (!transport) return;
    transport.loop = false;
    transport.start(`+${delaySec}`, 0);
  }

  cancelScheduledPlayback(): void {
    const transport = this._Tone?.getTransport();
    if (transport) {
      for (const eventId of this._transportEvents) transport.clear(eventId);
      transport.stop();
      transport.cancel(0);
      transport.loop = false;
      transport.seconds = 0;
    }
    this._transportEvents.clear();
    this._synth?.releaseAll(this.now());
  }

  releaseAll(): void {
    this._synth?.releaseAll(this.now());
    this._active.clear();
    this._activePCs.clear();
  }

  now(): number {
    return this._Tone?.now() ?? 0;
  }

  getActivePitchClasses(): PitchClass[] { return Array.from(this._activePCs); }
}
