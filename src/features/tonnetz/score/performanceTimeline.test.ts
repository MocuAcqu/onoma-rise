import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";
import { parseMidi } from "./music";
import {
  buildPerformanceTimeline,
  eventAtPerformancePosition,
  nearestPlaybackPositionForNotationBeat,
  upperStaffMelodyNotes,
} from "./performanceTimeline";

describe("performance timeline", () => {
  it("uses one event stream for chords, releases and silence", () => {
    const midi = new Midi();
    midi.header.setTempo(60);
    const track = midi.addTrack();
    track.addNote({ midi: 60, time: 0, duration: 1, velocity: 0.7 });
    track.addNote({ midi: 64, time: 0, duration: 0.5, velocity: 0.7 });
    track.addNote({ midi: 67, time: 1.5, duration: 0.5, velocity: 0.7 });
    const score = parseMidi(midi.toArray(), "");
    const timeline = buildPerformanceTimeline(score, (seconds) => seconds);

    expect(timeline?.events.map((event) => ({
      start: event.start,
      end: event.end,
      pitches: event.pitches,
    }))).toEqual([
      { start: 0, end: 0.5, pitches: ["C", "E"] },
      { start: 0.5, end: 1, pitches: ["C"] },
      { start: 1, end: 1.5, pitches: [] },
      { start: 1.5, end: 2, pitches: ["G"] },
    ]);
  });

  it("finds the same active event used by every consumer", () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 60, time: 0, duration: 0.25, velocity: 0.7 });
    const timeline = buildPerformanceTimeline(parseMidi(midi.toArray(), ""), () => 3);

    expect(eventAtPerformancePosition(timeline, 0.1)?.pitches).toEqual(["C"]);
    expect(eventAtPerformancePosition(timeline, 0.1)?.notationBeat).toBe(3);
    expect(eventAtPerformancePosition(timeline, 0.25)).toBeNull();
  });

  it("uses the highest simultaneous note from the upper staff for melody", () => {
    const midi = new Midi();
    const upperStaff = midi.addTrack();
    upperStaff.addNote({ midi: 72, time: 0, duration: 1, velocity: 0.7 });
    upperStaff.addNote({ midi: 76, time: 0, duration: 1, velocity: 0.7 });
    upperStaff.addNote({ midi: 74, time: 1, duration: 1, velocity: 0.7 });
    const lowerStaff = midi.addTrack();
    lowerStaff.addNote({ midi: 48, time: 0, duration: 2, velocity: 0.7 });
    lowerStaff.addNote({ midi: 79, time: 1, duration: 1, velocity: 0.7 });

    const timeline = buildPerformanceTimeline(parseMidi(midi.toArray(), ""), (seconds) => seconds);
    expect(upperStaffMelodyNotes(timeline).map((note) => note.midi)).toEqual([76, 74]);
  });

  it("selects the repeated occurrence nearest the current playhead", () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 60, time: 1, duration: 0.5, velocity: 0.7 });
    track.addNote({ midi: 60, time: 5, duration: 0.5, velocity: 0.7 });
    const score = parseMidi(midi.toArray(), "");
    // Simulate an expanded repeat: both playback notes refer to beat 1.
    score.notes[0].startBeat = 1;
    score.notes[1].startBeat = 1;
    const timeline = buildPerformanceTimeline(score, (seconds) => seconds);

    expect(nearestPlaybackPositionForNotationBeat(timeline, 1, 4.8)).toBe(5);
    expect(nearestPlaybackPositionForNotationBeat(timeline, 1, 1.2)).toBe(1);
    expect(nearestPlaybackPositionForNotationBeat(timeline, 9, 0)).toBeNull();
  });
});
