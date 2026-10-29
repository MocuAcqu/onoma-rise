import { NUM_TO_PITCH, PITCH_TO_NUM } from "../config";
import type { PitchClass } from "../types";
import type { Score } from "./music";
import type {
  PerformanceTimeline,
  PerformanceTimelineNote,
} from "./performanceTimeline";
import { scorePrefersFlats, spellPitchClass } from "./pitchSpelling";

const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
  2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53,
  2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

const MAJOR_NAMES = [
  "Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F",
  "C", "G", "D", "A", "E", "B", "F#", "C#",
] as const;
const MINOR_NAMES = [
  "Ab", "Eb", "Bb", "F", "C", "G", "D",
  "A", "E", "B", "F#", "C#", "G#", "D#", "A#",
] as const;

type KeyMode = "major" | "minor";
type ChordQuality =
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "dominant7"
  | "major7"
  | "minor7"
  | "halfDiminished7"
  | "diminished7"
  | "sus2"
  | "sus4";

type ChordTemplate = {
  quality: ChordQuality;
  intervals: readonly number[];
  suffix: string;
  tonnetzQuality: "major" | "minor" | null;
};

const CHORD_TEMPLATES: readonly ChordTemplate[] = [
  { quality: "dominant7", intervals: [0, 4, 7, 10], suffix: "7", tonnetzQuality: "major" },
  { quality: "major7", intervals: [0, 4, 7, 11], suffix: "maj7", tonnetzQuality: "major" },
  { quality: "minor7", intervals: [0, 3, 7, 10], suffix: "m7", tonnetzQuality: "minor" },
  { quality: "halfDiminished7", intervals: [0, 3, 6, 10], suffix: "m7♭5", tonnetzQuality: null },
  { quality: "diminished7", intervals: [0, 3, 6, 9], suffix: "dim7", tonnetzQuality: null },
  { quality: "major", intervals: [0, 4, 7], suffix: "", tonnetzQuality: "major" },
  { quality: "minor", intervals: [0, 3, 7], suffix: "m", tonnetzQuality: "minor" },
  { quality: "diminished", intervals: [0, 3, 6], suffix: "dim", tonnetzQuality: null },
  { quality: "augmented", intervals: [0, 4, 8], suffix: "aug", tonnetzQuality: null },
  { quality: "sus2", intervals: [0, 2, 7], suffix: "sus2", tonnetzQuality: null },
  { quality: "sus4", intervals: [0, 5, 7], suffix: "sus4", tonnetzQuality: null },
];

export type ScoreKeyEstimate = {
  tonic: PitchClass;
  tonicName: string;
  mode: KeyMode;
  label: string;
  confidence: number;
  fifths: number | null;
  source: "musicxml" | "analysis";
  preferFlats: boolean;
};

export type ScoreHarmony = {
  chordName: string;
  romanNumeral: string;
  quality: ChordQuality;
  root: PitchClass;
  pitchClasses: PitchClass[];
  notes: string[];
  bass: string;
  bassPitchClass: PitchClass;
  inversion: number;
  confidence: number;
  tonnetzChord: [PitchClass, PitchClass, PitchClass] | null;
};

export type HarmonicTimelineEvent = {
  id: string;
  start: number;
  end: number;
  notationBeat: number;
  harmony: ScoreHarmony;
};

export type PitchClassMotion = {
  semitones: number;
  direction: "ascending" | "descending" | "same";
};

/** A set-level comparison between two adjacent detected chord blocks. */
export type HarmonyTransition = {
  previousChord: string;
  currentChord: string;
  previousPitchClasses: PitchClass[];
  currentPitchClasses: PitchClass[];
  commonPitchClasses: PitchClass[];
  removedPitchClasses: PitchClass[];
  addedPitchClasses: PitchClass[];
  previousRoot: PitchClass;
  currentRoot: PitchClass;
  rootMotion: PitchClassMotion;
  previousBass: PitchClass;
  currentBass: PitchClass;
  bassMotion: PitchClassMotion;
  previousInversion: number;
  currentInversion: number;
  previousRomanNumeral: string;
  currentRomanNumeral: string;
  previousTonnetzChord: [PitchClass, PitchClass, PitchClass] | null;
  currentTonnetzChord: [PitchClass, PitchClass, PitchClass] | null;
};

type KeyCandidate = {
  tonic: number;
  tonicName: string;
  mode: KeyMode;
  score: number;
};

const mod12 = (value: number) => ((value % 12) + 12) % 12;
const ADJACENT_HARMONY_EPSILON = 0.000_01;

function tagValue(block: string, tag: string) {
  const match = block.match(
    new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>\\s*([^<]+?)\\s*</(?:\\w+:)?${tag}>`, "i"),
  );
  return match?.[1]?.trim() ?? null;
}

function musicXmlKey(xml: string) {
  const block = xml.match(
    /<(?:\w+:)?key\b[^>]*>([\s\S]*?)<\/(?:\w+:)?key>/i,
  )?.[1];
  if (!block) return null;
  const rawFifths = tagValue(block, "fifths");
  if (rawFifths === null) return null;
  const fifths = Number(rawFifths);
  if (!Number.isInteger(fifths) || fifths < -7 || fifths > 7) return null;
  const rawMode = tagValue(block, "mode")?.toLowerCase();
  const mode: KeyMode | null = rawMode === "major" || rawMode === "minor"
    ? rawMode
    : null;
  return { fifths, mode };
}

function correlation(values: readonly number[], profile: readonly number[], tonic: number) {
  const rotated = values.map((_, pitch) => profile[mod12(pitch - tonic)]);
  const valueMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const profileMean = rotated.reduce((sum, value) => sum + value, 0) / rotated.length;
  let numerator = 0;
  let valueSquare = 0;
  let profileSquare = 0;
  for (let index = 0; index < values.length; index += 1) {
    const valueDelta = values[index] - valueMean;
    const profileDelta = rotated[index] - profileMean;
    numerator += valueDelta * profileDelta;
    valueSquare += valueDelta * valueDelta;
    profileSquare += profileDelta * profileDelta;
  }
  const denominator = Math.sqrt(valueSquare * profileSquare);
  return denominator ? numerator / denominator : 0;
}

function keyCandidate(
  histogram: readonly number[],
  tonic: number,
  tonicName: string,
  mode: KeyMode,
  finalPitches: ReadonlySet<number>,
): KeyCandidate {
  const profile = mode === "major" ? MAJOR_PROFILE : MINOR_PROFILE;
  const cadenceBonus = finalPitches.has(tonic) ? 0.12 : 0;
  return {
    tonic,
    tonicName,
    mode,
    score: correlation(histogram, profile, tonic) + cadenceBonus,
  };
}

/** Estimate one global key. MusicXML mode wins; otherwise compare key profiles. */
export function estimateScoreKey(score: Score | null): ScoreKeyEstimate | null {
  if (!score?.notes.length) return null;
  const xmlKey = musicXmlKey(score.xml);
  const preferFlats = scorePrefersFlats(score.xml, xmlKey?.fifths ?? null);
  const histogram = Array.from({ length: 12 }, () => 0);
  for (const note of score.notes) {
    histogram[mod12(note.midi)] += Math.max(0.125, note.durationBeats);
  }
  const finalEnd = Math.max(...score.notes.map((note) => note.startBeat + note.durationBeats));
  const finalPitches = new Set(
    score.notes
      .filter((note) => Math.abs(note.startBeat + note.durationBeats - finalEnd) < 0.05)
      .map((note) => mod12(note.midi)),
  );

  if (xmlKey?.mode) {
    const nameIndex = xmlKey.fifths + 7;
    const tonicName = xmlKey.mode === "major"
      ? MAJOR_NAMES[nameIndex]
      : MINOR_NAMES[nameIndex];
    const tonic = xmlKey.mode === "major"
      ? mod12(xmlKey.fifths * 7)
      : mod12(xmlKey.fifths * 7 + 9);
    return {
      tonic: NUM_TO_PITCH[tonic],
      tonicName,
      mode: xmlKey.mode,
      label: `${tonicName} ${xmlKey.mode}`,
      confidence: 0.99,
      fifths: xmlKey.fifths,
      source: "musicxml",
      preferFlats,
    };
  }

  let candidates: KeyCandidate[];
  if (xmlKey) {
    const index = xmlKey.fifths + 7;
    const majorTonic = mod12(xmlKey.fifths * 7);
    candidates = [
      keyCandidate(histogram, majorTonic, MAJOR_NAMES[index], "major", finalPitches),
      keyCandidate(histogram, mod12(majorTonic + 9), MINOR_NAMES[index], "minor", finalPitches),
    ];
  } else {
    candidates = Array.from({ length: 12 }, (_, tonic) => [
      keyCandidate(histogram, tonic, spellPitchClass(tonic, preferFlats), "major", finalPitches),
      keyCandidate(histogram, tonic, spellPitchClass(tonic, preferFlats), "minor", finalPitches),
    ]).flat();
  }
  candidates.sort((left, right) => right.score - left.score);
  const best = candidates[0];
  const runnerUp = candidates[1];
  const gap = best.score - (runnerUp?.score ?? best.score);
  const confidence = Math.min(0.95, 0.5 + Math.max(0, gap) * 1.5);
  const fifths = xmlKey?.fifths ?? null;
  return {
    tonic: NUM_TO_PITCH[best.tonic],
    tonicName: best.tonicName,
    mode: best.mode,
    label: `${best.tonicName} ${best.mode}`,
    confidence,
    fifths,
    source: "analysis",
    preferFlats,
  };
}

const MAJOR_DEGREES = ["I", "♭II", "II", "♭III", "III", "IV", "♯IV", "V", "♭VI", "VI", "♭VII", "VII"];
const MINOR_DEGREES = ["I", "♭II", "II", "III", "♯III", "IV", "♯IV", "V", "VI", "♯VI", "VII", "♯VII"];

function romanNumeral(
  root: number,
  template: ChordTemplate,
  inversion: number,
  key: ScoreKeyEstimate,
) {
  const degree = (key.mode === "major" ? MAJOR_DEGREES : MINOR_DEGREES)[
    mod12(root - Number(Object.entries(NUM_TO_PITCH).find(([, pitch]) => pitch === key.tonic)?.[0] ?? 0))
  ];
  const lower = ["minor", "minor7", "diminished", "diminished7", "halfDiminished7"].includes(template.quality);
  const accidental = degree.match(/^[♭♯]/)?.[0] ?? "";
  const numeral = degree.slice(accidental.length);
  let result = accidental + (lower ? numeral.toLowerCase() : numeral);
  if (template.quality === "diminished" || template.quality === "diminished7") result += "°";
  if (template.quality === "halfDiminished7") result += "ø";
  if (template.quality === "augmented") result += "+";
  if (template.quality === "sus2") result += "sus2";
  if (template.quality === "sus4") result += "sus4";

  if (template.intervals.length === 4) {
    const figures = ["7", "6/5", "4/3", "4/2"];
    if (template.quality === "major7") result += "maj";
    result += figures[inversion] ?? "7";
  } else {
    result += ["", "6", "6/4"][inversion] ?? "";
  }
  return result;
}

/** Identify the best current chord from every sounding staff/voice. */
export function analyzeScoreHarmony(
  notes: readonly PerformanceTimelineNote[],
  key: ScoreKeyEstimate | null,
): ScoreHarmony | null {
  if (!key || notes.length < 2) return null;
  const pitchClasses = new Set(notes.map((note) => mod12(note.midi)));
  if (pitchClasses.size < 3) return null;
  const bassPitch = mod12(Math.min(...notes.map((note) => note.midi)));

  const candidates = Array.from({ length: 12 }, (_, root) => (
    CHORD_TEMPLATES.map((template) => {
      const expected = template.intervals.map((interval) => mod12(root + interval));
      const matched = expected.filter((pitch) => pitchClasses.has(pitch)).length;
      const missing = expected.length - matched;
      const extras = [...pitchClasses].filter((pitch) => !expected.includes(pitch)).length;
      const exact = missing === 0 && extras === 0;
      const score = matched * 2 - missing * 1.8 - extras * 1.15
        + (pitchClasses.has(root) ? 0.35 : 0)
        + (bassPitch === root ? 0.2 : 0)
        + (exact ? 1 : 0);
      return { root, template, expected, matched, missing, extras, exact, score };
    })
  )).flat()
    .filter((candidate) => candidate.matched >= 3 && candidate.missing <= 1)
    .sort((left, right) => right.score - left.score || Number(right.exact) - Number(left.exact));

  const best = candidates[0];
  if (!best) return null;
  const inversion = best.expected.indexOf(bassPitch);
  const usableInversion = inversion >= 0 ? inversion : 0;
  const rootName = spellPitchClass(best.root, key.preferFlats);
  const bassName = spellPitchClass(bassPitch, key.preferFlats);
  const slashBass = inversion > 0 ? `/${bassName}` : "";
  // Display the actual voicing from bass upward, not chromatic pitch-class
  // order, so an inversion such as G7/B reads B–D–F–G.
  const soundingNames = [...new Set(
    [...notes]
      .sort((left, right) => left.midi - right.midi)
      .map((note) => mod12(note.midi)),
  )].map((pitch) => spellPitchClass(pitch, key.preferFlats));
  const soundingPitchClasses = [...new Set(
    [...notes]
      .sort((left, right) => left.midi - right.midi)
      .map((note) => NUM_TO_PITCH[mod12(note.midi)]),
  )];
  const runnerUp = candidates[1];
  const margin = best.score - (runnerUp?.score ?? best.score);
  const confidence = Math.max(
    0.35,
    Math.min(0.99, 0.55 + (best.exact ? 0.28 : 0) + margin * 0.04 - best.extras * 0.06),
  );
  const tonnetzIntervals = best.template.tonnetzQuality === "major"
    ? [0, 4, 7]
    : best.template.tonnetzQuality === "minor" ? [0, 3, 7] : null;

  return {
    chordName: `${rootName}${best.template.suffix}${slashBass}`,
    romanNumeral: romanNumeral(best.root, best.template, usableInversion, key),
    quality: best.template.quality,
    root: NUM_TO_PITCH[best.root],
    pitchClasses: soundingPitchClasses,
    notes: soundingNames,
    bass: bassName,
    bassPitchClass: NUM_TO_PITCH[bassPitch],
    inversion: usableInversion,
    confidence,
    tonnetzChord: tonnetzIntervals
      ? tonnetzIntervals.map((interval) => NUM_TO_PITCH[mod12(best.root + interval)]) as [PitchClass, PitchClass, PitchClass]
      : null,
  };
}

function shortestPitchClassMotion(
  previous: PitchClass,
  current: PitchClass,
): PitchClassMotion {
  const ascending = mod12(PITCH_TO_NUM[current] - PITCH_TO_NUM[previous]);
  if (ascending === 0) return { semitones: 0, direction: "same" };
  // A tritone is equally short in both directions. Keep the deterministic
  // ascending spelling here; enharmonic note names remain a display concern.
  if (ascending <= 6) return { semitones: ascending, direction: "ascending" };
  return { semitones: 12 - ascending, direction: "descending" };
}

function samePitchClassSet(
  previous: readonly PitchClass[],
  current: readonly PitchClass[],
) {
  const currentSet = new Set(current);
  return previous.length === currentSet.size
    && previous.every((pitch) => currentSet.has(pitch));
}

/**
 * Compare two detected harmonies without attempting note-to-note voice
 * assignment. Values stay in canonical pitch classes; enharmonic spelling is
 * deliberately deferred to the display layer.
 */
export function analyzeHarmonyTransition(
  previous: ScoreHarmony | null,
  current: ScoreHarmony | null,
): HarmonyTransition | null {
  if (!previous || !current) return null;

  const pitchClassesUnchanged = samePitchClassSet(
    previous.pitchClasses,
    current.pitchClasses,
  );
  const unchanged = pitchClassesUnchanged
    && previous.root === current.root
    && previous.bassPitchClass === current.bassPitchClass
    && previous.inversion === current.inversion
    && previous.romanNumeral === current.romanNumeral
    && previous.chordName === current.chordName;
  if (unchanged) return null;

  const previousSet = new Set(previous.pitchClasses);
  const currentSet = new Set(current.pitchClasses);

  return {
    previousChord: previous.chordName,
    currentChord: current.chordName,
    previousPitchClasses: previous.pitchClasses,
    currentPitchClasses: current.pitchClasses,
    commonPitchClasses: previous.pitchClasses
      .filter((pitch) => currentSet.has(pitch)),
    removedPitchClasses: previous.pitchClasses
      .filter((pitch) => !currentSet.has(pitch)),
    addedPitchClasses: current.pitchClasses
      .filter((pitch) => !previousSet.has(pitch)),
    previousRoot: previous.root,
    currentRoot: current.root,
    rootMotion: shortestPitchClassMotion(previous.root, current.root),
    previousBass: previous.bassPitchClass,
    currentBass: current.bassPitchClass,
    bassMotion: shortestPitchClassMotion(
      previous.bassPitchClass,
      current.bassPitchClass,
    ),
    previousInversion: previous.inversion,
    currentInversion: current.inversion,
    previousRomanNumeral: previous.romanNumeral,
    currentRomanNumeral: current.romanNumeral,
    previousTonnetzChord: previous.tonnetzChord,
    currentTonnetzChord: current.tonnetzChord,
  };
}

/** Resolve the transition ending at the currently active harmony block. */
export function harmonyTransitionForEvent(
  events: readonly HarmonicTimelineEvent[],
  currentEventId: string | null,
): HarmonyTransition | null {
  if (!currentEventId) return null;
  const currentIndex = events.findIndex((event) => event.id === currentEventId);
  if (currentIndex <= 0) return null;
  const previous = events[currentIndex - 1];
  const current = events[currentIndex];
  // HarmonicTimeline omits rests, single notes, dyads and other unknown
  // sonorities. Do not bridge those omitted spans and present distant chords
  // as a direct progression.
  if (Math.abs(previous.end - current.start) >= ADJACENT_HARMONY_EPSILON) {
    return null;
  }
  return analyzeHarmonyTransition(
    previous.harmony,
    current.harmony,
  );
}

/** Collapse note-boundary events into stable, clickable harmony blocks. */
export function buildHarmonicTimeline(
  timeline: PerformanceTimeline | null,
  key: ScoreKeyEstimate | null,
): HarmonicTimelineEvent[] {
  if (!timeline || !key) return [];
  const result: HarmonicTimelineEvent[] = [];
  for (const event of timeline.events) {
    const harmony = analyzeScoreHarmony(event.notes, key);
    if (!harmony) continue;
    const previous = result.at(-1);
    const sameHarmony = previous
      && previous.harmony.chordName === harmony.chordName
      && previous.harmony.romanNumeral === harmony.romanNumeral
      && Math.abs(previous.end - event.start) < ADJACENT_HARMONY_EPSILON;
    if (sameHarmony) {
      previous.end = event.end;
      // Favor the strongest observation when a merged block crosses several
      // note boundaries (for example a re-articulated inner voice).
      if (harmony.confidence > previous.harmony.confidence) {
        previous.harmony = harmony;
      }
      continue;
    }
    result.push({
      id: `harmony-${result.length}`,
      start: event.start,
      end: event.end,
      notationBeat: event.notationBeat,
      harmony,
    });
  }
  return result;
}

export function harmonicEventAtPosition(
  events: readonly HarmonicTimelineEvent[],
  seconds: number,
) {
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
