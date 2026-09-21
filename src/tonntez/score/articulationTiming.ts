import type { Score } from "./music";

export type ArticulationEvent = {
  id: string;
  kind: "articulation";
  articulation: string;
  part: number;
  startBeat: number;
  endBeat: number;
  pitches: number[];
  gate: number;
  velocityDelta: number;
};

export function withArticulationPlayback(score: Score | null): Score | null {
  if (!score || !score.articulations.length) return score;
  return {
    ...score,
    notes: score.notes.map((note) => {
      const matching = score.articulations.filter((event) =>
        event.part === note.part &&
        event.pitches.includes(note.midi) &&
        Math.abs(event.startBeat - note.startBeat) < 0.03,
      );
      if (!matching.length) return note;
      const gate = Math.min(...matching.map((event) => event.gate));
      const velocityDelta = matching.reduce((sum, event) => sum + event.velocityDelta, 0);
      return {
        ...note,
        durationBeats: Math.max(0.03, note.durationBeats * gate),
        velocity: Math.min(1, Math.max(0.05, note.velocity + velocityDelta)),
      };
    }),
  };
}
