import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";

import { withArticulationPlayback } from "./articulationTiming";
import { parseMidi } from "./music";

describe("articulation playback", () => {
  it("changes playback gate and attack while retaining the written XML", () => {
    const midi = new Midi();
    midi.header.setTempo(120);
    midi.addTrack().addNote({ midi: 60, time: 0, duration: 1, velocity: 0.6 });
    const score = parseMidi(midi.toArray(), "<written-score/>", [], [], [], [{
      id: "a", kind: "articulation", articulation: "staccato", part: 1,
      startBeat: 0, endBeat: 2, pitches: [60], gate: 0.5, velocityDelta: 0.12,
    }]);
    const played = withArticulationPlayback(score)!;
    expect(played.xml).toBe("<written-score/>");
    expect(played.notes[0].durationBeats).toBe(1);
    expect(played.notes[0].velocity).toBeCloseTo(0.72);
  });
});
