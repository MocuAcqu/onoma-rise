import { NUM_TO_PITCH } from "../constants";
import type { Score } from "./music";

export function scorePitchesAt(score: Score | null, seconds: number) {
  return Array.from(
    new Set(
      (score?.notes ?? [])
        .filter(
          (note) => note.time <= seconds && seconds < note.time + note.duration,
        )
        .map((note) => NUM_TO_PITCH[note.midi % 12]),
    ),
  );
}
