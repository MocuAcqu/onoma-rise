import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";
import { parseMidi } from "./music";
import { buildPlaybackBatches } from "./playbackScheduling";
import { buildPerformanceTimeline } from "./performanceTimeline";

function timelineWith(notes: Array<{ midi: number; time: number; duration: number }>) {
  const midi = new Midi();
  const track = midi.addTrack();
  for (const note of notes) track.addNote({ ...note, velocity: 0.7 });
  return buildPerformanceTimeline(parseMidi(midi.toArray(), ""), () => 0);
}

function timelineWithParts(
  parts: Array<Array<{ midi: number; time: number; duration: number }>>,
) {
  const midi = new Midi();
  for (const notes of parts) {
    const track = midi.addTrack();
    for (const note of notes) track.addNote({ ...note, velocity: 0.7 });
  }
  return buildPerformanceTimeline(parseMidi(midi.toArray(), ""), () => 0);
}

describe("score playback scheduling", () => {
  it("groups a chord into one scheduler callback", () => {
    const timeline = timelineWith([
      { midi: 60, time: 0, duration: 0.1 },
      { midi: 64, time: 0, duration: 0.1 },
      { midi: 67, time: 0, duration: 0.1 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 1.5);

    expect(batches).toHaveLength(1);
    expect(batches[0].notes.map((note) => note.name)).toEqual(["C4", "E4", "G4"]);
  });

  it("preserves every dense onset while scaling its time", () => {
    const timeline = timelineWith([
      { midi: 60, time: 0, duration: 0.04 },
      { midi: 62, time: 0.05, duration: 0.04 },
      { midi: 64, time: 0.1, duration: 0.04 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 2);

    expect(batches.map((batch) => batch.delay)).toEqual([0, 0.025, 0.05]);
    expect(batches.every((batch) => batch.notes.length === 1)).toBe(true);
    expect(batches[0].minimumDuration).toBeCloseTo(0.01625);
  });

  it("expands note timing and duration at 0.1x inspection speed", () => {
    const timeline = timelineWith([
      { midi: 60, time: 0, duration: 0.5 },
      { midi: 64, time: 1, duration: 0.5 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 0.1);

    expect(batches[1].delay).toBeCloseTo(10);
    expect(batches[0].notes[0].duration).toBeCloseTo(5);
    expect(batches[1].notes[0].duration).toBeCloseTo(5);
  });

  it("resumes a note already sounding at the seek position", () => {
    const timeline = timelineWith([
      { midi: 60, time: 0, duration: 1 },
      { midi: 64, time: 1, duration: 0.5 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0.75, 1);

    expect(batches[0].delay).toBe(0);
    expect(batches[0].notes[0].duration).toBeCloseTo(0.25);
    expect(batches[1].delay).toBeCloseTo(0.25);
  });

  it("crossfades repeated piano notes without a silent re-strike gap", () => {
    const timeline = timelineWith([
      { midi: 60, time: 0, duration: 1 },
      { midi: 60, time: 0.5, duration: 0.5 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 1);

    // Fade starts 25ms before the next attack and its 100ms tail overlaps it.
    expect(batches[0].notes[0].duration).toBeCloseTo(0.475);
    expect(batches[0].notes[0].release).toBeCloseTo(0.1);
    expect(
      batches[0].notes[0].duration + (batches[0].notes[0].release ?? 0),
    ).toBeGreaterThan(batches[1].delay);
    expect(batches[1].notes[0].duration).toBeCloseTo(0.5);
    expect(batches[1].notes[0].release).toBeUndefined();
  });

  it("preserves an already-short articulation before a repeated pitch", () => {
    const timeline = timelineWith([
      { midi: 60, time: 0, duration: 0.1 },
      { midi: 60, time: 0.5, duration: 0.5 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 1);

    expect(batches[0].notes[0].duration).toBeCloseTo(0.1);
    expect(batches[0].notes[0].release).toBeUndefined();
  });

  it("does not detach different pitches or the same pitch in another part", () => {
    const timeline = timelineWithParts([
      [
        { midi: 60, time: 0, duration: 1 },
        { midi: 62, time: 0.5, duration: 0.5 },
      ],
      [{ midi: 60, time: 0.5, duration: 0.5 }],
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 1);

    expect(batches[0].notes[0].duration).toBeCloseTo(1);
    expect(batches[0].notes[0].release).toBeUndefined();
    expect(batches[1].notes.every((note) => note.release === undefined)).toBe(true);
  });

  it("clears the first short note after a rest without cutting sustained harmony", () => {
    const timeline = timelineWith([
      { midi: 55, time: 0, duration: 0.1 },
      { midi: 60, time: 0.5, duration: 0.1 },
      { midi: 48, time: 0.5, duration: 0.3 },
      { midi: 62, time: 0.6, duration: 0.1 },
    ]);

    const batches = buildPlaybackBatches(timeline, 0, 1.5);
    const afterRest = batches.find((batch) =>
      batch.notes.some((note) => note.name === "C4")
    );
    const melody = afterRest?.notes.find((note) => note.name === "C4");
    const harmony = afterRest?.notes.find((note) => note.name === "C3");

    expect(afterRest?.delay).toBeCloseTo(1 / 3, 5);
    expect(melody?.duration).toBeCloseTo((0.1 / 1.5) * 0.82, 5);
    expect(harmony?.duration).toBeCloseTo(0.3 / 1.5, 5);
  });
});
