import { NUM_TO_PITCH } from "../config";
import type { PitchClass } from "../types";
import type { Score } from "./music";

const TIME_PRECISION = 1_000_000;
const EPSILON = 1 / TIME_PRECISION;

export type PerformanceTimelineNote = Score["notes"][number] & {
  id: string;
};

export type PerformanceTimelineEvent = {
  id: string;
  start: number;
  end: number;
  notationBeat: number;
  notes: PerformanceTimelineNote[];
  noteOnsets: PerformanceTimelineNote[];
  pitches: PitchClass[];
};

export type PerformanceTimeline = {
  duration: number;
  notes: PerformanceTimelineNote[];
  events: PerformanceTimelineEvent[];
};

function timeKey(seconds: number) {
  return Math.round(Math.max(0, seconds) * TIME_PRECISION);
}

/**
 * Creates the single event stream consumed by audio, Tonnetz and notation.
 * Boundaries include note endings so silence and overlapping voices are also
 * represented instead of being inferred independently by each view.
 */
export function buildPerformanceTimeline(
  score: Score | null,
  notationBeatAt: (seconds: number) => number,
): PerformanceTimeline | null {
  if (!score) return null;

  const notes = score.notes.map((note, index) => ({
    ...note,
    id: `score-${index}`,
  }));
  const starts = new Map<number, PerformanceTimelineNote[]>();
  const ends = new Map<number, PerformanceTimelineNote[]>();
  const boundaries = new Set<number>([0, timeKey(score.duration)]);

  for (const note of notes) {
    const start = timeKey(note.time);
    const end = timeKey(note.time + note.duration);
    boundaries.add(start);
    boundaries.add(end);
    starts.set(start, [...(starts.get(start) ?? []), note]);
    ends.set(end, [...(ends.get(end) ?? []), note]);
  }

  const ordered = [...boundaries].sort((a, b) => a - b);
  const active = new Map<string, PerformanceTimelineNote>();
  const events: PerformanceTimelineEvent[] = [];

  for (let index = 0; index + 1 < ordered.length; index += 1) {
    const key = ordered[index];
    const nextKey = ordered[index + 1];
    for (const note of ends.get(key) ?? []) active.delete(note.id);
    const noteOnsets = starts.get(key) ?? [];
    for (const note of noteOnsets) active.set(note.id, note);

    const start = key / TIME_PRECISION;
    const end = nextKey / TIME_PRECISION;
    if (end - start < EPSILON) continue;
    const soundingNotes = [...active.values()];
    events.push({
      id: `playback-${events.length}`,
      start,
      end,
      notationBeat: Math.max(0, notationBeatAt(start)),
      notes: soundingNotes,
      noteOnsets,
      pitches: Array.from(new Set(
        soundingNotes.map((note) => NUM_TO_PITCH[note.midi % 12]),
      )),
    });
  }

  return { duration: score.duration, notes, events };
}

export function eventAtPerformancePosition(
  timeline: PerformanceTimeline | null,
  seconds: number,
) {
  const events = timeline?.events ?? [];
  let low = 0;
  let high = events.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const event = events[middle];
    if (seconds < event.start) high = middle - 1;
    else if (seconds >= event.end) low = middle + 1;
    else return event;
  }
  return null;
}

/**
 * Resolves a written score position to the closest matching playback
 * occurrence. Repeats can place the same notation beat at several different
 * times, so the occurrence nearest the current playhead feels predictable.
 */
export function nearestPlaybackPositionForNotationBeat(
  timeline: PerformanceTimeline | null,
  notationBeat: number,
  currentPosition: number,
): number | null {
  const candidates = (timeline?.notes ?? []).filter(
    (note) => Math.abs(note.startBeat - notationBeat) < 0.03,
  );
  if (!candidates.length) return null;

  return candidates.reduce((nearest, note) => (
    Math.abs(note.time - currentPosition) < Math.abs(nearest.time - currentPosition)
      ? note
      : nearest
  )).time;
}

/**
 * Build the single-note melody shown by Melody Window from the upper staff.
 * The recognition pipeline writes the upper staff as the first MIDI part. If
 * that staff contains a chord, its highest note represents the melodic line.
 */
export function upperStaffMelodyNotes(
  timeline: PerformanceTimeline | null,
): PerformanceTimelineNote[] {
  const notes = timeline?.notes ?? [];
  if (!notes.length) return [];

  const upperStaffPart = Math.min(...notes.map((note) => note.part));
  const melodyAtOnset = new Map<number, PerformanceTimelineNote>();
  for (const note of notes) {
    if (note.part !== upperStaffPart) continue;
    const onset = timeKey(note.time);
    const current = melodyAtOnset.get(onset);
    if (!current || note.midi > current.midi) melodyAtOnset.set(onset, note);
  }
  return [...melodyAtOnset.values()].sort((a, b) => a.time - b.time);
}
