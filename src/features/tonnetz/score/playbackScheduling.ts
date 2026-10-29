import type { PerformanceTimeline } from "./performanceTimeline";
import { eventAtPerformancePosition } from "./performanceTimeline";

const TIME_PRECISION = 1_000_000;
const BASE_MINIMUM_DURATION = 0.025;
const DENSE_NOTE_MINIMUM = 0.012;
const MAX_DENSE_MINIMUM = 0.04;
const DENSE_GATE = 0.82;
const REST_LOOKBACK = 0.0001;
// A piano attack remains perceptually distinct while older tones decay below
// it. Start fading shortly before a repeated strike, but let that tail overlap
// the new attack instead of inserting an audible silent gap.
const REPEATED_PRE_FADE = 0.025;
const MAX_PRE_FADE_IOI_RATIO = 0.20;
const MIN_REPEATED_RELEASE = 0.05;
const MAX_REPEATED_RELEASE = 0.10;
const REPEATED_RELEASE_IOI_RATIO = 0.35;

export type ScheduledBatchNote = {
  name: string;
  midi: number;
  duration: number;
  velocity: number;
  release?: number;
};

export type PlaybackBatch = {
  delay: number;
  minimumDuration: number;
  notes: ScheduledBatchNote[];
};

/** Find the next strictly later onset for the same pitch in the same part. */
function repeatedNoteOnsets(timeline: PerformanceTimeline) {
  const groups = new Map<string, PerformanceTimeline["notes"]>();
  for (const note of timeline.notes) {
    const key = `${note.part}:${note.midi}`;
    groups.set(key, [...(groups.get(key) ?? []), note]);
  }

  const result = new Map<string, number>();
  for (const notes of groups.values()) {
    notes.sort((left, right) => left.time - right.time);
    for (let index = 0; index < notes.length; index += 1) {
      const onsetKey = Math.round(notes[index].time * TIME_PRECISION);
      let next = index + 1;
      // Notes at one onset can be unisons. They are a chord, not repetitions.
      while (
        next < notes.length
        && Math.round(notes[next].time * TIME_PRECISION) === onsetKey
      ) next += 1;
      if (next < notes.length) result.set(notes[index].id, notes[next].time);
    }
  }
  return result;
}

/** Group equal onsets so dense chords share one precise audio-clock time. */
export function buildPlaybackBatches(
  timeline: PerformanceTimeline | null,
  offset: number,
  speed: number,
): PlaybackBatch[] {
  if (!timeline || speed <= 0) return [];
  const groups = new Map<number, ScheduledBatchNote[]>();
  const nextRepeatedOnset = repeatedNoteOnsets(timeline);

  for (const note of timeline.notes) {
    const noteEnd = note.time + note.duration;
    let release: number | undefined;
    if (noteEnd <= offset) continue;
    const effectiveStart = Math.max(note.time, offset);
    const key = Math.round(
      ((effectiveStart - offset) / speed) * TIME_PRECISION,
    );
    let duration = (noteEnd - effectiveStart) / speed;
    const repeatedOnset = nextRepeatedOnset.get(note.id);
    if (repeatedOnset !== undefined) {
      const timeUntilRepeat = (repeatedOnset - effectiveStart) / speed;
      const preFade = Math.min(
        REPEATED_PRE_FADE,
        timeUntilRepeat * MAX_PRE_FADE_IOI_RATIO,
      );
      const repeatedRelease = Math.min(
        MAX_REPEATED_RELEASE,
        Math.max(
          MIN_REPEATED_RELEASE,
          timeUntilRepeat * REPEATED_RELEASE_IOI_RATIO,
        ),
      );
      const maximumHold = Math.max(0.005, timeUntilRepeat - preFade);

      // The release tail continues beyond the next attack. This mirrors the
      // acoustic overlap of piano tones while the new transient re-articulates
      // the pitch. Existing short articulations remain intact.
      if (duration > maximumHold) {
        duration = maximumHold;
        release = repeatedRelease;
      }
    }
    if (duration <= 0) continue;
    groups.set(key, [
      ...(groups.get(key) ?? []),
      {
        name: note.name,
        midi: note.midi,
        duration,
        velocity: note.velocity,
        release,
      },
    ]);
  }

  const batches = [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([key, notes]) => ({
      delay: key / TIME_PRECISION,
      minimumDuration: BASE_MINIMUM_DURATION,
      notes,
    }));

  for (let index = 0; index + 1 < batches.length; index += 1) {
    const interval = batches[index + 1].delay - batches[index].delay;
    batches[index].minimumDuration = Math.min(
      MAX_DENSE_MINIMUM,
      Math.max(DENSE_NOTE_MINIMUM, interval * 0.65),
    );
    if (speed <= 1) continue;

    const sourceStart = offset + batches[index].delay * speed;
    const eventBefore = eventAtPerformancePosition(
      timeline,
      Math.max(0, sourceStart - REST_LOOKBACK),
    );
    const followsRest = sourceStart > REST_LOOKBACK
      && (!eventBefore || eventBefore.notes.length === 0);
    if (!followsRest) continue;

    // Only shorten the first fast melodic note after silence. Longer harmony
    // notes that intentionally continue below the following onset are kept.
    const maximumShortDuration = interval * DENSE_GATE;
    for (const note of batches[index].notes) {
      if (note.duration <= interval * 1.1) {
        note.duration = Math.min(note.duration, maximumShortDuration);
      }
    }
  }
  return batches;
}
