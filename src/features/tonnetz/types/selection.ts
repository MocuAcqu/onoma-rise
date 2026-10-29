import type { PitchClass } from "./music";

export type SelectionInfo =
  | { kind: "note"; label: PitchClass; note: string }
  | {
      kind: "chord";
      chordType: "major" | "minor";
      chordName: string;
      notes: [PitchClass, PitchClass, PitchClass];
    }
  | null;
