import type { Score } from "./music";

export type PerformanceEvent = {
  kind: "tempo" | "dynamic";
  curve: "step" | "linear";
  startBeat: number;
  endBeat: number;
  startValue: number;
  endValue: number;
  label: string;
};

function integrateTempo(
  beats: number,
  startBpm: number,
  endBpm: number,
) {
  if (beats <= 0) return 0;
  if (Math.abs(endBpm - startBpm) < 1e-8) return (beats * 60) / startBpm;
  const rate = (endBpm - startBpm) / beats;
  return (60 / rate) * Math.log(endBpm / startBpm);
}

export function secondsAtBeat(score: Score, targetBeat: number) {
  const target = Math.max(0, targetBeat);
  const events = score.performance
    .filter((event) => event.kind === "tempo")
    .sort((a, b) => a.startBeat - b.startBeat);
  let seconds = 0;
  let beat = 0;
  let bpm = score.bpm;
  for (const event of events) {
    if (event.startBeat > target) break;
    if (event.startBeat > beat) {
      seconds += ((event.startBeat - beat) * 60) / bpm;
      beat = event.startBeat;
    }
    if (event.curve === "step" || event.endBeat <= event.startBeat) {
      bpm = event.endValue;
      continue;
    }
    const span = event.endBeat - event.startBeat;
    const used = Math.min(target, event.endBeat) - event.startBeat;
    if (used > 0) {
      const usedEnd =
        event.startValue +
        (event.endValue - event.startValue) * (used / span);
      seconds += integrateTempo(used, event.startValue, usedEnd);
      beat = event.startBeat + used;
    }
    if (target <= event.endBeat) return seconds;
    bpm = event.endValue;
  }
  return seconds + ((target - beat) * 60) / bpm;
}

function dynamicAtBeat(score: Score, beat: number, fallback: number) {
  const events = score.performance
    .filter((event) => event.kind === "dynamic")
    .sort((a, b) => a.startBeat - b.startBeat);
  if (!events.length) return fallback;
  let value = fallback;
  for (const event of events) {
    if (beat < event.startBeat) break;
    if (event.curve === "linear" && beat < event.endBeat) {
      const ratio = (beat - event.startBeat) / (event.endBeat - event.startBeat);
      return event.startValue + (event.endValue - event.startValue) * ratio;
    }
    value = event.endValue;
  }
  return Math.min(1, Math.max(0.05, value));
}

export function withPerformancePlayback(score: Score | null): Score | null {
  if (!score) return null;
  const notes = score.notes.map((note) => {
    const time = secondsAtBeat(score, note.startBeat);
    const end = secondsAtBeat(score, note.startBeat + note.durationBeats);
    return {
      ...note,
      time,
      duration: Math.max(0.01, end - time),
      velocity: dynamicAtBeat(score, note.startBeat, note.velocity),
    };
  });
  return {
    ...score,
    notes,
    duration: secondsAtBeat(score, score.durationBeats),
  };
}

export function beatAtPerformanceTime(score: Score, seconds: number) {
  let low = 0;
  let high = score.durationBeats;
  for (let index = 0; index < 36; index++) {
    const middle = (low + high) / 2;
    if (secondsAtBeat(score, middle) < seconds) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
