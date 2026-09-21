import type * as Tone from "tone";

export type PianoInstrument =
  | Tone.Sampler
  | Tone.PolySynth<Tone.Synth>;

const SAMPLE_URLS = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
};

function sampleBaseUrl() {
  const appBase = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${appBase}audio/piano/salamander/`;
}

function createFallbackSynth(tone: typeof Tone): Tone.PolySynth<Tone.Synth> {
  return new tone.PolySynth(tone.Synth, {
    oscillator: {
      type: "custom",
      partials: [1, 0.58, 0.31, 0.19, 0.12, 0.075, 0.045, 0.028],
    },
    envelope: {
      attack: 0.006,
      decay: 1.15,
      sustain: 0.08,
      release: 0.9,
    },
    volume: -8,
  }).toDestination();
}

/** Load the bundled Yamaha C5 samples, with a lightweight offline fallback. */
export function createPianoInstrument(
  tone: typeof Tone,
): Promise<PianoInstrument> {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = globalThis.setTimeout(useFallback, 15_000);

    function finish(instrument: PianoInstrument) {
      if (settled) {
        instrument.dispose();
        return;
      }
      settled = true;
      globalThis.clearTimeout(timeout);
      resolve(instrument);
    }

    function useFallback() {
      if (settled) return;
      sampler?.dispose();
      finish(createFallbackSynth(tone));
    }

    const sampler = new tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: sampleBaseUrl(),
      attack: 0,
      release: 1.05,
      curve: "exponential",
      volume: -7,
      onload: () => finish(sampler),
      onerror: useFallback,
    }).toDestination();
  });
}
