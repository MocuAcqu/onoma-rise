import { describe, expect, it } from "vitest";

import {
  scorePrefersFlats,
  spellMidiNote,
  spellPitchClass,
} from "./pitchSpelling";

describe("score pitch spelling", () => {
  it("uses flat enharmonic names without changing pitch class", () => {
    expect(spellPitchClass("A#", true)).toBe("Bb");
    expect(spellMidiNote(70, true)).toBe("Bb4");
    expect(spellMidiNote(70, false)).toBe("A#4");
  });

  it("prefers the MusicXML key signature", () => {
    expect(scorePrefersFlats("", -2)).toBe(true);
    expect(scorePrefersFlats("", 3)).toBe(false);
  });

  it("falls back to written accidentals for a neutral key signature", () => {
    const xml = "<pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch>";
    expect(scorePrefersFlats(xml, 0)).toBe(true);
  });
});
