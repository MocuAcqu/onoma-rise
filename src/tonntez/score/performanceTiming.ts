import type { Score } from "./music";

export type PerformanceEvent = {
  kind: "tempo" | "dynamic" | "expression";
  curve: "step" | "linear";
  startBeat: number;
  endBeat: number;
  startValue?: number;
  endValue?: number;
  label: string;
  gate?: number;
  velocityDelta?: number;
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
      bpm = event.endValue ?? bpm;
      continue;
    }
    const span = event.endBeat - event.startBeat;
    const used = Math.min(target, event.endBeat) - event.startBeat;
    if (used > 0) {
      const usedEnd =
        (event.startValue ?? bpm) +
        ((event.endValue ?? bpm) - (event.startValue ?? bpm)) * (used / span);
      seconds += integrateTempo(used, event.startValue ?? bpm, usedEnd);
      beat = event.startBeat + used;
    }
    if (target <= event.endBeat) return seconds;
    bpm = event.endValue ?? bpm;
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
      return (event.startValue ?? value) + ((event.endValue ?? value) - (event.startValue ?? value)) * ratio;
    }
    value = event.endValue ?? value;
  }
  return Math.min(1, Math.max(0.05, value));
}

export function withPerformancePlayback(score: Score | null): Score | null {
  if (!score) return null;
  const notes = score.notes.map((note) => {
    const expressions = score.performance.filter((event) =>
      event.kind === "expression" &&
      note.startBeat >= event.startBeat && note.startBeat < event.endBeat,
    );
    const gate = expressions.reduce((value, event) => value * (event.gate ?? 1), 1);
    // startBeat/durationBeats are notation-domain coordinates shared by the
    // OSMD cursor, ornaments and repeat mapping. Expression playback may
    // shorten the audible envelope, but must never extend or rewrite them.
    const playbackDurationBeats = Math.max(
      0.03,
      Math.min(note.durationBeats, note.durationBeats * gate),
    );
    const velocityDelta = expressions.reduce((value, event) => value + (event.velocityDelta ?? 0), 0);
    const time = secondsAtBeat(score, note.startBeat);
    const end = secondsAtBeat(score, note.startBeat + playbackDurationBeats);
    return {
      ...note,
      time,
      duration: Math.max(0.01, end - time),
      velocity: Math.min(1, Math.max(0.05,
        dynamicAtBeat(score, note.startBeat, note.velocity) + velocityDelta,
      )),
    };
  });
  return {
    ...score,
    notes,
    duration: Math.max(
      secondsAtBeat(score, score.durationBeats),
      ...notes.map((note) => note.time + note.duration),
    ),
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
