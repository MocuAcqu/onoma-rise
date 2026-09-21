import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";

import { parseMidi } from "./music";
import { sourceTimeAtRepeatPosition, withRepeatPlayback } from "./repeatPlayback";

function scoreWith(xml: string) {
  const midi = new Midi();
  midi.header.setTempo(60);
  const track = midi.addTrack();
  [60, 62, 64, 65].forEach((pitch, index) => {
    track.addNote({ midi: pitch, time: index, duration: 1, velocity: 0.7 });
  });
  return parseMidi(midi.toArray(), xml);
}

const header = `<?xml version="1.0"?><score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">`;
const footer = `</part></score-partwise>`;
const note = (step: string) => `<note><pitch><step>${step}</step><octave>4</octave></pitch>
  <duration>1</duration><type>quarter</type></note>`;

describe("repeat playback", () => {
  it("expands a standard repeat and maps playback back to the printed measure", () => {
    const xml = `${header}
      <measure number="1"><attributes><divisions>1</divisions></attributes>
        <barline location="left"><repeat direction="forward"/></barline>${note("C")}</measure>
      <measure number="2">${note("D")}</measure>
      <measure number="3">${note("E")}<barline location="right"><repeat direction="backward"/></barline></measure>
      <measure number="4">${note("F")}</measure>${footer}`;
    const repeated = withRepeatPlayback(scoreWith(xml))!;

    expect(repeated.notes.map((item) => item.midi)).toEqual([60, 62, 64, 60, 62, 64, 65]);
    expect(repeated.notes.map((item) => item.time)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(repeated.duration).toBe(7);
    expect(sourceTimeAtRepeatPosition(3.1, repeated.repeatSegments)).toBeCloseTo(0.1);
  });

  it("plays first and second endings on their corresponding passes", () => {
    const xml = `${header}
      <measure number="1"><attributes><divisions>1</divisions></attributes>
        <barline location="left"><repeat direction="forward"/></barline>${note("C")}</measure>
      <measure number="2"><barline location="left"><ending number="1" type="start"/></barline>
        ${note("D")}<barline location="right"><ending number="1" type="stop"/>
        <repeat direction="backward"/></barline></measure>
      <measure number="3"><barline location="left"><ending number="2" type="start"/></barline>
        ${note("E")}<barline location="right"><ending number="2" type="stop"/></barline></measure>
      <measure number="4">${note("F")}</measure>${footer}`;
    const repeated = withRepeatPlayback(scoreWith(xml))!;

    expect(repeated.notes.map((item) => item.midi)).toEqual([60, 62, 60, 64, 65]);
    expect(repeated.duration).toBe(5);
  });

  it("returns only once even when recognition emits a large times value", () => {
    const xml = `${header}
      <measure number="1"><attributes><divisions>1</divisions></attributes>
        <barline location="left"><repeat direction="forward"/></barline>${note("C")}</measure>
      <measure number="2">${note("D")}<barline location="right">
        <repeat direction="backward" times="99"/></barline></measure>
      <measure number="3">${note("E")}</measure>
      <measure number="4">${note("F")}</measure>${footer}`;
    const repeated = withRepeatPlayback(scoreWith(xml))!;

    expect(repeated.notes.map((item) => item.midi)).toEqual([60, 62, 60, 62, 64, 65]);
    expect(repeated.duration).toBe(6);
  });
});
