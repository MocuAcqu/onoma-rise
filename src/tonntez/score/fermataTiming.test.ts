import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "./music";
import {
  FERMATA_FACTOR,
  fermataHolds,
  sourceTime,
  withFermataPlayback,
  type NotationMark,
} from "./fermataTiming";

const mark: NotationMark = {
  id: "0:0",
  part: 1,
  measure: 1,
  label: "C4",
  startBeat: 0,
  durationBeats: 1,
  dots: 0,
  fermata: true,
};
function fixture(marks: NotationMark[]) {
  const midi = new Midi();
  midi.header.setTempo(60);
  const track = midi.addTrack();
  track.addNote({ midi: 60, time: 0, duration: 1 });
  track.addNote({ midi: 64, time: 0, duration: 1 });
  track.addNote({ midi: 67, time: 1, duration: 1 });
  return parseMidi(midi.toArray(), "", marks);
}
describe("fermata playback", () => {
  it("doubles the held chord and shifts following notes without changing original data", () => {
    const original = fixture([mark]);
    const result = withFermataPlayback(original)!;
    expect(result.notes.map((n) => [n.time, n.duration])).toEqual([
      [0, 2],
      [0, 2],
      [2, 1],
    ]);
    expect(result.duration).toBe(3);
    expect(original.notes[0].duration).toBe(1);
    expect(FERMATA_FACTOR).toBe(2);
    expect(sourceTime(1.5, fermataHolds(original))).toBeCloseTo(0.98);
    expect(sourceTime(2, fermataHolds(original))).toBe(1);
  });
  it("does not stretch ordinary dots or double-count a fermata across staves", () => {
    expect(
      withFermataPlayback(fixture([{ ...mark, dots: 1, fermata: false }]))!
        .duration,
    ).toBe(2);
    expect(
      withFermataPlayback(fixture([mark, { ...mark, id: "1:0", part: 2 }]))!
        .duration,
    ).toBe(3);
  });
  it("holds a rest in silence and delays subsequent notes", () => {
    const score = fixture([
      { ...mark, label: "休止符", startBeat: 2, durationBeats: 1 },
    ]);
    score.notes.push({ ...score.notes[0], time: 3, duration: 1 });
    score.duration = 4;
    const result = withFermataPlayback(score)!;
    expect(result.notes.at(-1)!.time).toBe(4);
    expect(result.notes[2].duration).toBe(1);
    expect(result.duration).toBe(5);
  });
});
