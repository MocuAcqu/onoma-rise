import type { Score } from "./music";
import { fermataHolds, performedTime } from "./fermataTiming";
import { secondsAtBeat } from "./performanceTiming";

type MeasureSpan = {
  startBeat: number;
  endBeat: number;
  forward: boolean;
  backwardTimes: number | null;
  endings: Set<number>;
};

// Product rule: every backward repeat returns once, so the section is heard
// exactly twice. OMR-generated `times` values are intentionally ignored.
const MAX_REPEAT_PASSES = 2;

export type RepeatSegment = {
  measureIndex: number;
  pass: number;
  playbackStart: number;
  playbackEnd: number;
  sourceStart: number;
  sourceEnd: number;
};

function attribute(fragment: string, name: string) {
  return new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i")
    .exec(fragment)?.[1];
}

function textNumber(fragment: string, tag: string) {
  const value = new RegExp(`<${tag}\\b[^>]*>([^<]+)</${tag}>`, "i")
    .exec(fragment)?.[1];
  return value === undefined ? undefined : Number(value.trim());
}

function endingNumbers(value = "") {
  const numbers = new Set<number>();
  for (const match of value.matchAll(/\d+/g)) numbers.add(Number(match[0]));
  return numbers;
}

function measureDuration(body: string, divisions: number, fallback: number) {
  let cursor = 0;
  let furthest = 0;
  let lastOnset = 0;
  const elements = /<(note|backup|forward)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of body.matchAll(elements)) {
    const kind = match[1].toLowerCase();
    const content = match[2];
    const duration = textNumber(content, "duration") ?? 0;
    if (kind === "backup") cursor = Math.max(0, cursor - duration);
    else if (kind === "forward") cursor += duration;
    else if (!/<grace\b/i.test(content)) {
      if (/<chord\b/i.test(content)) {
        furthest = Math.max(furthest, lastOnset + duration);
      } else {
        lastOnset = cursor;
        cursor += duration;
      }
    }
    furthest = Math.max(furthest, cursor);
  }
  return furthest > 0 ? furthest / divisions : fallback;
}

function measureSpans(xml: string): MeasureSpan[] {
  const part = /<part(?=\s|>)[^>]*>([\s\S]*?)<\/part>/i.exec(xml)?.[1];
  if (!part) return [];
  const rawMeasures = [...part.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/gi)]
    .map((match) => match[1]);
  let divisions = 1;
  let beats = 4;
  let beatType = 4;
  let startBeat = 0;
  const activeEndings = new Set<number>();
  return rawMeasures.map((body) => {
    divisions = textNumber(body, "divisions") ?? divisions;
    beats = textNumber(body, "beats") ?? beats;
    beatType = textNumber(body, "beat-type") ?? beatType;
    const starts = [...body.matchAll(/<ending\b([^>]*)\/?>/gi)]
      .filter((match) => attribute(match[1], "type") === "start");
    for (const start of starts)
      for (const number of endingNumbers(attribute(start[1], "number")))
        activeEndings.add(number);

    let forward = false;
    let backwardTimes: number | null = null;
    for (const repeat of body.matchAll(/<repeat\b([^>]*)\/?>/gi)) {
      const direction = attribute(repeat[1], "direction");
      if (direction === "forward") forward = true;
      if (direction === "backward") backwardTimes = MAX_REPEAT_PASSES;
    }
    const duration = measureDuration(body, divisions, beats * 4 / beatType);
    const span = {
      startBeat,
      endBeat: startBeat + duration,
      forward,
      backwardTimes,
      endings: new Set(activeEndings),
    };
    startBeat += duration;

    const stops = [...body.matchAll(/<ending\b([^>]*)\/?>/gi)]
      .filter((match) => ["stop", "discontinue"].includes(attribute(match[1], "type") ?? ""));
    for (const stop of stops)
      for (const number of endingNumbers(attribute(stop[1], "number")))
        activeEndings.delete(number);
    return span;
  });
}

function playbackOrder(measures: MeasureSpan[]) {
  const order: Array<{ index: number; pass: number }> = [];
  const completed = new Map<number, number>();
  let repeatStart = 0;
  let repeatPass = 1;
  let index = 0;
  let guard = 0;
  while (index < measures.length && guard++ < Math.max(32, measures.length * 12)) {
    const measure = measures[index];
    if (measure.forward && index !== repeatStart) {
      repeatStart = index;
      repeatPass = 1;
    }
    const allowed = !measure.endings.size || measure.endings.has(repeatPass);
    if (allowed) order.push({ index, pass: repeatPass });
    if (allowed && measure.backwardTimes) {
      const played = completed.get(index) ?? 1;
      const totalPasses = Math.min(MAX_REPEAT_PASSES, measure.backwardTimes);
      if (played < totalPasses) {
        completed.set(index, played + 1);
        repeatPass = played + 1;
        index = repeatStart;
        continue;
      }
      repeatStart = index + 1;
    }
    index++;
  }
  return order;
}

export function withRepeatPlayback(score: Score | null) {
  if (!score) return null;
  const measures = measureSpans(score.xml);
  const order = playbackOrder(measures);
  if (!measures.length || !order.length) {
    return { ...score, repeatSegments: [] as RepeatSegment[] };
  }
  const linear = order.length === measures.length
    && order.every((item, index) => item.index === index);
  if (linear) {
    return {
      ...score,
      repeatSegments: [{
        measureIndex: 0,
        pass: 1,
        playbackStart: 0,
        playbackEnd: score.duration,
        sourceStart: 0,
        sourceEnd: score.duration,
      }] as RepeatSegment[],
    };
  }

  let playbackTime = 0;
  const notes: Score["notes"] = [];
  const repeatSegments: RepeatSegment[] = [];
  const holds = fermataHolds(score);
  const boundaryTimes = new Map<number, number>();
  const sourceSecondsAtBeat = (beat: number) => {
    const cached = boundaryTimes.get(beat);
    if (cached !== undefined) return cached;
    const value = performedTime(secondsAtBeat(score, beat), holds);
    boundaryTimes.set(beat, value);
    return value;
  };
  for (const item of order) {
    const measure = measures[item.index];
    const sourceStart = sourceSecondsAtBeat(measure.startBeat);
    const sourceEnd = sourceSecondsAtBeat(measure.endBeat);
    const segmentDuration = Math.max(0, sourceEnd - sourceStart);
    repeatSegments.push({
      measureIndex: item.index,
      pass: item.pass,
      playbackStart: playbackTime,
      playbackEnd: playbackTime + segmentDuration,
      sourceStart,
      sourceEnd,
    });
    for (const note of score.notes) {
      if (
        note.startBeat < measure.startBeat - 1e-6
        || note.startBeat >= measure.endBeat - 1e-6
      ) continue;
      notes.push({
        ...note,
        time: playbackTime + Math.max(0, note.time - sourceStart),
      });
    }
    playbackTime += segmentDuration;
  }
  notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
  return {
    ...score,
    notes,
    duration: Math.max(playbackTime, ...notes.map((note) => note.time + note.duration)),
    repeatSegments,
  };
}

export function sourceTimeAtRepeatPosition(
  position: number,
  segments: RepeatSegment[],
) {
  if (!segments.length) return Math.max(0, position);
  const clamped = Math.max(0, position);
  const segment = segments.find(
    (item) => clamped >= item.playbackStart && clamped < item.playbackEnd - 1e-7,
  ) ?? segments.at(-1)!;
  return Math.min(
    segment.sourceEnd,
    segment.sourceStart + Math.max(0, clamped - segment.playbackStart),
  );
}
