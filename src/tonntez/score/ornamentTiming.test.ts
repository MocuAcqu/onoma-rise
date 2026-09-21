import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";

import { parseMidi } from "./music";
import { withOrnamentPlayback, type OrnamentEvent } from "./ornamentTiming";

function scoreWith(event: OrnamentEvent) {
  const midi = new Midi();
  midi.header.setTempo(120);
  midi.addTrack().addNote({ midi: 76, time: 0, duration: 2, velocity: 0.7 });
  return parseMidi(midi.toArray(), "<score-partwise/>", [], [], [event]);
}

describe("ornament playback", () => {
  it("expands a trill for the full wavy-line beat span without changing XML", () => {
    const score = scoreWith({
      id: "trill", kind: "ornament", ornament: "trill", part: 1, measure: 1,
      startBeat: 0, endBeat: 4, principalMidi: 76, auxiliaryMidi: 78,
    });
    const played = withOrnamentPlayback(score)!;
    expect(played.xml).toBe(score.xml);
    expect(played.notes).toHaveLength(16);
    expect(played.notes.slice(0, 4).map((note) => note.midi)).toEqual([76, 78, 76, 78]);
    expect(played.notes.at(-1)?.startBeat).toBe(3.75);
  });

  it("keeps grace notes small in notation data and borrows playback time from the anchor", () => {
    const score = scoreWith({
      id: "grace", kind: "grace", ornament: "acciaccatura", part: 1, measure: 1,
      startBeat: 0, endBeat: 4, principalMidi: 76, pitches: [74],
    });
    const played = withOrnamentPlayback(score)!;
    expect(played.notes.map((note) => note.midi)).toEqual([74, 76]);
    expect(played.notes[0].durationBeats).toBeCloseTo(0.23);
    expect(played.notes[1].startBeat).toBe(0.25);
  });
});
