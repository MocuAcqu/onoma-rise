import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";
import {
  analyzeHarmonyTransition,
  analyzeScoreHarmony,
  buildHarmonicTimeline,
  estimateScoreKey,
  harmonicEventAtPosition,
  harmonyTransitionForEvent,
} from "./harmonicAnalysis";
import { parseMidi } from "./music";
import { buildPerformanceTimeline } from "./performanceTimeline";

function scoreWithChord(
  pitches: number[],
  keyXml: string,
) {
  const midi = new Midi();
  const track = midi.addTrack();
  pitches.forEach((pitch) => {
    track.addNote({ midi: pitch, time: 0, duration: 1, velocity: 0.7 });
  });
  const xml = `<score-partwise><part><measure><attributes><key>${keyXml}</key></attributes></measure></part></score-partwise>`;
  const score = parseMidi(midi.toArray(), xml);
  const timeline = buildPerformanceTimeline(score, () => 0);
  return { score, notes: timeline?.events[0]?.notes ?? [] };
}

function sequentialHarmonies(
  previousPitches: number[],
  currentPitches: number[],
  keyXml: string,
) {
  const midi = new Midi();
  const track = midi.addTrack();
  previousPitches.forEach((pitch) => {
    track.addNote({ midi: pitch, time: 0, duration: 1, velocity: 0.7 });
  });
  currentPitches.forEach((pitch) => {
    track.addNote({ midi: pitch, time: 1, duration: 1, velocity: 0.7 });
  });
  const xml = `<score-partwise><key>${keyXml}</key></score-partwise>`;
  const score = parseMidi(midi.toArray(), xml);
  const key = estimateScoreKey(score);
  const timeline = buildPerformanceTimeline(score, (seconds) => seconds);
  const harmonies = buildHarmonicTimeline(timeline, key);
  const transition = analyzeHarmonyTransition(
    harmonies[0]?.harmony ?? null,
    harmonies[1]?.harmony ?? null,
  );
  return { harmonies, transition };
}

describe("score harmonic analysis", () => {
  it("uses an explicit MusicXML mode when available", () => {
    const { score } = scoreWithChord([57, 60, 64], "<fifths>0</fifths><mode>minor</mode>");
    expect(estimateScoreKey(score)).toMatchObject({
      tonic: "A",
      mode: "minor",
      label: "A minor",
      source: "musicxml",
    });
  });

  it("distinguishes a relative major using duration and final-tonic evidence", () => {
    const { score } = scoreWithChord([48, 52, 55, 59, 60], "<fifths>0</fifths>");
    expect(estimateScoreKey(score)).toMatchObject({ tonic: "C", mode: "major" });
  });

  it("labels a first-inversion tonic chord and exposes its Tonnetz triad", () => {
    const { score, notes } = scoreWithChord([52, 55, 60], "<fifths>0</fifths><mode>major</mode>");
    const harmony = analyzeScoreHarmony(notes, estimateScoreKey(score));
    expect(harmony).toMatchObject({
      chordName: "C/E",
      romanNumeral: "I6",
      bass: "E",
      tonnetzChord: ["C", "E", "G"],
    });
  });

  it("labels a dominant seventh inversion in the current key", () => {
    const { score, notes } = scoreWithChord([59, 62, 65, 67], "<fifths>0</fifths><mode>major</mode>");
    const harmony = analyzeScoreHarmony(notes, estimateScoreKey(score));
    expect(harmony).toMatchObject({
      chordName: "G7/B",
      romanNumeral: "V6/5",
      notes: ["B", "D", "F", "G"],
    });
  });

  it("spells chords with flats when the score uses a flat key signature", () => {
    const { score, notes } = scoreWithChord(
      [58, 62, 65],
      "<fifths>-2</fifths><mode>major</mode>",
    );
    const harmony = analyzeScoreHarmony(notes, estimateScoreKey(score));
    expect(harmony).toMatchObject({
      chordName: "Bb",
      notes: ["Bb", "D", "F"],
      romanNumeral: "I",
    });
  });

  it("changes the same D minor chord from ii to iv with the key", () => {
    const major = scoreWithChord([50, 53, 57], "<fifths>0</fifths><mode>major</mode>");
    const minor = scoreWithChord([50, 53, 57], "<fifths>0</fifths><mode>minor</mode>");
    expect(analyzeScoreHarmony(major.notes, estimateScoreKey(major.score))?.romanNumeral).toBe("ii");
    expect(analyzeScoreHarmony(minor.notes, estimateScoreKey(minor.score))?.romanNumeral).toBe("iv");
  });

  it("merges adjacent note-boundary events with the same harmony", () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 48, time: 0, duration: 1, velocity: 0.7 });
    track.addNote({ midi: 55, time: 0, duration: 1, velocity: 0.7 });
    track.addNote({ midi: 64, time: 0, duration: 0.5, velocity: 0.7 });
    track.addNote({ midi: 64, time: 0.5, duration: 0.5, velocity: 0.7 });
    const xml = "<score-partwise><key><fifths>0</fifths><mode>major</mode></key></score-partwise>";
    const score = parseMidi(midi.toArray(), xml);
    const timeline = buildPerformanceTimeline(score, (seconds) => seconds);
    const harmony = buildHarmonicTimeline(timeline, estimateScoreKey(score));

    expect(harmony).toHaveLength(1);
    expect(harmony[0]).toMatchObject({ start: 0, end: 1 });
    expect(harmony[0].harmony).toMatchObject({ chordName: "C", romanNumeral: "I" });
    expect(harmonicEventAtPosition(harmony, 0.75)?.id).toBe(harmony[0].id);
    expect(harmonicEventAtPosition(harmony, 1)).toBeNull();
  });

  it("compares C major to A minor as pitch-class sets", () => {
    const { transition } = sequentialHarmonies(
      [48, 52, 55],
      [45, 48, 52],
      "<fifths>0</fifths><mode>major</mode>",
    );

    expect(transition).toMatchObject({
      previousChord: "C",
      currentChord: "Am",
      commonPitchClasses: ["C", "E"],
      removedPitchClasses: ["G"],
      addedPitchClasses: ["A"],
      rootMotion: { semitones: 3, direction: "descending" },
    });
  });

  it("keeps root and bass motion separate for G minor to F/A", () => {
    const { transition } = sequentialHarmonies(
      [55, 58, 62],
      [57, 60, 65],
      "<fifths>-2</fifths><mode>major</mode>",
    );

    expect(transition).toMatchObject({
      previousChord: "Gm",
      currentChord: "F/A",
      commonPitchClasses: [],
      previousRoot: "G",
      currentRoot: "F",
      rootMotion: { semitones: 2, direction: "descending" },
      previousBass: "G",
      currentBass: "A",
      bassMotion: { semitones: 2, direction: "ascending" },
      previousInversion: 0,
      currentInversion: 1,
    });
  });

  it("reports an inversion change when the pitch-class set is unchanged", () => {
    const { transition } = sequentialHarmonies(
      [52, 55, 60],
      [55, 60, 64],
      "<fifths>0</fifths><mode>major</mode>",
    );

    expect(transition).toMatchObject({
      previousChord: "C/E",
      currentChord: "C/G",
      commonPitchClasses: ["E", "G", "C"],
      removedPitchClasses: [],
      addedPitchClasses: [],
      previousRoot: "C",
      currentRoot: "C",
      rootMotion: { semitones: 0, direction: "same" },
      previousBass: "E",
      currentBass: "G",
      bassMotion: { semitones: 3, direction: "ascending" },
      previousInversion: 1,
      currentInversion: 2,
    });
  });

  it("does not create a visible transition for an unchanged harmony", () => {
    const { harmonies } = sequentialHarmonies(
      [48, 52, 55],
      [48, 52, 55],
      "<fifths>0</fifths><mode>major</mode>",
    );
    // The timeline merge already collapses these two blocks. The analyzer also
    // protects callers that compare an unchanged harmony directly.
    expect(harmonies).toHaveLength(1);
    expect(analyzeHarmonyTransition(
      harmonies[0].harmony,
      harmonies[0].harmony,
    )).toBeNull();
  });

  it("does not resolve a transition for the first or an unknown chord block", () => {
    const { harmonies } = sequentialHarmonies(
      [48, 52, 55],
      [45, 48, 52],
      "<fifths>0</fifths><mode>major</mode>",
    );
    expect(harmonyTransitionForEvent(harmonies, harmonies[0].id)).toBeNull();
    expect(harmonyTransitionForEvent(harmonies, "missing")).toBeNull();
    expect(harmonyTransitionForEvent(harmonies, harmonies[1].id)).not.toBeNull();
  });

  it("does not bridge across an intervening single-note or dyad span", () => {
    const midi = new Midi();
    const track = midi.addTrack();
    [48, 52, 55].forEach((pitch) => {
      track.addNote({ midi: pitch, time: 0, duration: 1, velocity: 0.7 });
    });
    // This middle span is deliberately not a chord, so it interrupts the
    // relationship between the surrounding C major and A minor blocks.
    track.addNote({ midi: 50, time: 1, duration: 1, velocity: 0.7 });
    [45, 48, 52].forEach((pitch) => {
      track.addNote({ midi: pitch, time: 2, duration: 1, velocity: 0.7 });
    });
    const xml = "<score-partwise><key><fifths>0</fifths><mode>major</mode></key></score-partwise>";
    const score = parseMidi(midi.toArray(), xml);
    const timeline = buildPerformanceTimeline(score, (seconds) => seconds);
    const harmonies = buildHarmonicTimeline(timeline, estimateScoreKey(score));

    expect(harmonies).toHaveLength(2);
    expect(harmonies[0].end).toBe(1);
    expect(harmonies[1].start).toBe(2);
    expect(harmonyTransitionForEvent(harmonies, harmonies[1].id)).toBeNull();
  });
});
