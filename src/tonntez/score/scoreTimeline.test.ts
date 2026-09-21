import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "./music";
import { scorePitchesAt } from "./scoreTimeline";

describe("score playback timeline", () => {
  it("retains all sounding pitch classes, deduplicates octaves and clears rests", () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 60, time: 0, duration: 2 });
    track.addNote({ midi: 72, time: 0, duration: 1 });
    track.addNote({ midi: 64, time: 0.5, duration: 0.5 });
    const score = parseMidi(midi.toArray(), "");
    expect(scorePitchesAt(score, 0.5)).toEqual(["C", "E"]);
    expect(scorePitchesAt(score, 1)).toEqual(["C"]);
    expect(scorePitchesAt(score, 2)).toEqual([]);
  });
  it("converts tempo changes to the same seconds used by the player", () => {
    const midi = new Midi();
    midi.header.tempos = [
      { ticks: 0, bpm: 120 },
      { ticks: midi.header.ppq * 2, bpm: 60 },
    ];
    midi.header.update();
    midi.addTrack().addNote({
      midi: 67,
      ticks: midi.header.ppq * 3,
      durationTicks: midi.header.ppq,
    });
    const score = parseMidi(midi.toArray(), "");
    expect(score.notes[0].time).toBeCloseTo(2);
    expect(score.notes[0].duration).toBeCloseTo(1);
    expect(scorePitchesAt(score, 1.9)).toEqual([]);
    expect(scorePitchesAt(score, 2)).toEqual(["G"]);
  });
});
