import { describe, expect, it } from "vitest";
import { pianoVelocityToGain } from "./ScorePianoEngine";

describe("score piano dynamics", () => {
  it("uses a square-law velocity curve for a clearer dynamic range", () => {
    expect(pianoVelocityToGain(0.4)).toBeCloseTo(0.16);
    expect(pianoVelocityToGain(0.76)).toBeCloseTo(0.5776);
  });

  it("clamps invalid velocity ranges before calculating gain", () => {
    expect(pianoVelocityToGain(-0.5)).toBe(0);
    expect(pianoVelocityToGain(1.5)).toBe(1);
  });
});
