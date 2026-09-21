import type { Score } from "./music";
import { secondsAtBeat } from "./performanceTiming";

export const FERMATA_FACTOR = 2;

export type NotationMark = {
  id: string;
  part: number;
  measure: number | null;
  label: string;
  startBeat: number;
  durationBeats: number;
  dots: number;
  fermata: boolean;
};
export type Hold = { at: number; extra: number };

export function fermataHolds(score: Score): Hold[] {
  const holds = new Map<number, number>();
  for (const mark of score.marks) {
    if (!mark.fermata) continue;
    const start = secondsAtBeat(score, mark.startBeat);
    const end = secondsAtBeat(score, mark.startBeat + mark.durationBeats);
    // One ensemble hold even when every staff carries the same fermata.
    const at = Math.round(end * 1e6) / 1e6;
    holds.set(
      at,
      Math.max(holds.get(at) ?? 0, (end - start) * (FERMATA_FACTOR - 1)),
    );
  }
  return [...holds]
    .map(([at, extra]) => ({ at, extra }))
    .sort((a, b) => a.at - b.at);
}
export function performedTime(source: number, holds: Hold[]) {
  return (
    source +
    holds.reduce(
      (extra, hold) => extra + (hold.at <= source + 1e-6 ? hold.extra : 0),
      0,
    )
  );
}
export function sourceTime(performed: number, holds: Hold[]) {
  let extra = 0;
  for (const hold of holds) {
    if (performed < hold.at + extra) break;
    if (performed < hold.at + extra + hold.extra)
      return Math.max(0, hold.at - 0.02);
    extra += hold.extra;
  }
  return performed - extra;
}
export function withFermataPlayback(score: Score | null) {
  if (!score) return null;
  const holds = fermataHolds(score);
  return {
    ...score,
    notes: score.notes.map((note) => {
      const time = performedTime(note.time, holds);
      return {
        ...note,
        time,
        duration: performedTime(note.time + note.duration, holds) - time,
      };
    }),
    duration: performedTime(
      Math.max(score.duration, ...holds.map((h) => h.at)),
      holds,
    ),
  };
}
