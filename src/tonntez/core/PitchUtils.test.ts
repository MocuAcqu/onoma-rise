import { describe, expect, it } from "vitest";
import PitchUtils from "./PitchUtils";

describe("PitchUtils", () => {
  it("normalizes flats and pitch strings", () => {
    expect(PitchUtils.toPitchClass("Bb4")).toBe("A#");
    expect(PitchUtils.toPitchClass(" C# ")).toBe("C#");
    expect(PitchUtils.toPitchClass("invalid")).toBeNull();
  });

  it("prefers MIDI when resolving melody pitches", () => {
    expect(PitchUtils.getMelodyPitchClass({
      id: "event",
      pitch: "C",
      midi: 70,
      start: 0,
      end: 1,
    })).toBe("A#");
  });

  it("keeps supplied note octaves and adds fallback octaves", () => {
    expect(PitchUtils.getMelodyNote({ id: "a", pitch: "F#3", start: 0, end: 1 }, 4)).toBe("F#3");
    expect(PitchUtils.getMelodyNote({ id: "b", pitch: "G", start: 0, end: 1 }, 5)).toBe("G5");
  });
});
