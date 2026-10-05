import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "./music";
import {
  beatAtPerformanceTime,
  secondsAtBeat,
  withPerformancePlayback,
  type PerformanceEvent,
} from "./performanceTiming";

function fixture(performance: PerformanceEvent[]) {
  const midi = new Midi();
  midi.header.setTempo(60);
  const track = midi.addTrack();
  track.addNote({ midi: 60, ticks: 0, durationTicks: midi.header.ppq, velocity: 0.5 });
  track.addNote({ midi: 62, ticks: midi.header.ppq, durationTicks: midi.header.ppq, velocity: 0.5 });
  return parseMidi(midi.toArray(), "", [], performance);
}

describe("performance rules", () => {
  it("integrates linear tempo curves and reverses seconds back to score beats", () => {
    const score = fixture([{
      kind: "tempo", curve: "linear", startBeat: 0, endBeat: 2,
      startValue: 60, endValue: 120, label: "accel.",
    }]);
    const end = secondsAtBeat(score, 2);
    expect(end).toBeCloseTo(2 * Math.log(2), 5);
    expect(beatAtPerformanceTime(score, end)).toBeCloseTo(2, 5);
  });

  it("applies dynamic steps and ramps to note velocity", () => {
    const score = fixture([
      { kind: "dynamic", curve: "step", startBeat: 0, endBeat: 0, startValue: 0.4, endValue: 0.4, label: "p" },
      { kind: "dynamic", curve: "linear", startBeat: 0, endBeat: 2, startValue: 0.4, endValue: 0.8, label: "cresc." },
    ]);
    const result = withPerformancePlayback(score)!;
    expect(result.notes[0].velocity).toBeCloseTo(0.4);
    expect(result.notes[1].velocity).toBeCloseTo(0.6);
  });

  it("applies expression gate and velocity for its beat range", () => {
    const score = fixture([{
      kind: "expression", curve: "step", startBeat: 0, endBeat: 1,
      gate: 0.88, velocityDelta: 0.15, label: "risoluto",
    }]);
    const result = withPerformancePlayback(score)!;

    expect(result.notes[0].durationBeats).toBeCloseTo(1);
    expect(result.notes[0].duration).toBeCloseTo(0.88);
    expect(result.notes[0].velocity).toBeCloseTo(0.65);
    expect(result.notes[1].durationBeats).toBeCloseTo(1);
    expect(result.notes[1].velocity).toBeCloseTo(0.5);
  });

  it("keeps notation beats stable when an expression requests a longer gate", () => {
    const score = fixture([{
      kind: "expression", curve: "step", startBeat: 0, endBeat: 2,
      gate: 1.1, velocityDelta: 0, label: "legato",
    }]);
    const result = withPerformancePlayback(score)!;

    expect(result.notes[0].startBeat).toBe(0);
    expect(result.notes[0].durationBeats).toBe(1);
    expect(result.notes[0].duration).toBeCloseTo(1);
    expect(result.notes[1].startBeat).toBe(1);
  });
});
