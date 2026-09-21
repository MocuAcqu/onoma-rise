import type { PitchClass } from "../types";

export const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const SQRT3 = Math.sqrt(3);

export const PITCH_TO_NUM: Record<PitchClass, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

export const NUM_TO_PITCH: Record<number, PitchClass> = {
  0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
};

export const KEY_TO_PITCH: Record<string, PitchClass> = {
  z: "C", s: "C#", x: "D", d: "D#", c: "E", v: "F",
  g: "F#", b: "G", h: "G#", n: "A", j: "A#", m: "B",
};
