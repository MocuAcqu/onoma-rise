import type { Score } from "./music";

export type OrnamentEvent = {
  id: string;
  kind: "ornament" | "grace";
  ornament: string;
  part: number;
  measure: number;
  startBeat: number;
  endBeat: number;
  principalMidi: number;
  auxiliaryMidi?: number;
  lowerAuxiliaryMidi?: number;
  secondaryMidi?: number;
  pitches?: number[];
  strokes?: number;
};

function noteName(midi: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function beatNote(template: Score["notes"][number], midi: number, start: number, duration: number, bpm: number) {
  return {
    ...template,
    midi,
    name: noteName(midi),
    startBeat: start,
    durationBeats: duration,
    time: start * 60 / bpm,
    duration: duration * 60 / bpm,
  };
}

function anchorFor(score: Score, event: OrnamentEvent) {
  return score.notes.find((note) =>
    note.part === event.part &&
    note.midi === event.principalMidi &&
    Math.abs(note.startBeat - event.startBeat) < 0.03,
  );
}

export function withOrnamentPlayback(score: Score | null): Score | null {
  if (!score || !score.ornaments.length) return score;
  let notes = [...score.notes];
  for (const event of [...score.ornaments].sort((a, b) => a.startBeat - b.startBeat)) {
    const anchor = anchorFor({ ...score, notes }, event);
    if (!anchor) continue;

    if (event.kind === "grace" && event.pitches?.length) {
      const originalStart = anchor.startBeat;
      const allowance = event.ornament === "appoggiatura"
        ? Math.min(anchor.durationBeats * 0.5, 1)
        : Math.min(anchor.durationBeats * 0.25, 0.25);
      const slice = allowance / event.pitches.length;
      notes = notes.filter((note) => note !== anchor);
      event.pitches.forEach((midi, index) => {
        notes.push(beatNote(anchor, midi, originalStart + slice * index, slice * 0.92, score.bpm));
      });
      notes.push(beatNote(
        anchor,
        anchor.midi,
        originalStart + allowance,
        Math.max(0.03, anchor.durationBeats - allowance),
        score.bpm,
      ));
      continue;
    }

    if (event.ornament === "arpeggiate") {
      const chord = notes
        .filter((note) => note.part === event.part && Math.abs(note.startBeat - event.startBeat) < 0.03)
        .sort((a, b) => a.midi - b.midi);
      const delays = new Map(chord.map((note, index) => [note, index * 0.06]));
      notes = notes.map((note) => {
        const delay = delays.get(note);
        return delay === undefined ? note : {
          ...note,
          startBeat: note.startBeat + delay,
          durationBeats: Math.max(0.03, note.durationBeats - delay),
        };
      });
      continue;
    }

    const patterns: Record<string, number[]> = {
      trill: [event.principalMidi, event.auxiliaryMidi ?? event.principalMidi + 2],
      mordent: [event.principalMidi, event.lowerAuxiliaryMidi ?? event.principalMidi - 2, event.principalMidi],
      "inverted-mordent": [event.principalMidi, event.auxiliaryMidi ?? event.principalMidi + 2, event.principalMidi],
      turn: [event.auxiliaryMidi ?? event.principalMidi + 2, event.principalMidi, event.lowerAuxiliaryMidi ?? event.principalMidi - 2, event.principalMidi],
      "inverted-turn": [event.lowerAuxiliaryMidi ?? event.principalMidi - 2, event.principalMidi, event.auxiliaryMidi ?? event.principalMidi + 2, event.principalMidi],
      tremolo: event.secondaryMidi
        ? [event.principalMidi, event.secondaryMidi]
        : [event.principalMidi],
    };
    const pattern = patterns[event.ornament];
    if (!pattern) continue;
    const end = Math.max(event.startBeat + 0.03, event.endBeat);
    const step = event.ornament === "trill" || event.ornament === "tremolo" ? 0.25 : (end - event.startBeat) / pattern.length;
    notes = notes.filter((note) => !(
      note.part === event.part &&
      note.midi === event.principalMidi &&
      note.startBeat >= event.startBeat - 0.03 &&
      note.startBeat < end - 0.01
    ));
    for (let beat = event.startBeat, index = 0; beat < end - 0.001; beat += step, index++) {
      notes.push(beatNote(anchor, pattern[index % pattern.length], beat, Math.min(step * 0.92, end - beat), score.bpm));
      if (event.ornament !== "trill" && event.ornament !== "tremolo" && index + 1 >= pattern.length) break;
    }
  }
  notes.sort((a, b) => a.startBeat - b.startBeat || a.midi - b.midi);
  return { ...score, notes };
}
