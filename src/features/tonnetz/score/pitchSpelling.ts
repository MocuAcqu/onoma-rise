import { NUM_TO_PITCH, PITCH_TO_NUM } from "../config";
import type { PitchClass } from "../types";

const FLAT_PITCH_NAMES = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/**
 * Keep the canonical sharp-based pitch class for Tonnetz calculations, but
 * choose an enharmonic spelling that matches the score when presenting it.
 */
export function spellPitchClass(
  pitch: number | PitchClass,
  preferFlats: boolean,
): string {
  const pitchNumber = typeof pitch === "number" ? pitch : PITCH_TO_NUM[pitch];
  return preferFlats
    ? FLAT_PITCH_NAMES[mod12(pitchNumber)]
    : NUM_TO_PITCH[mod12(pitchNumber)];
}

export function spellMidiNote(midi: number, preferFlats: boolean): string {
  const roundedMidi = Math.round(midi);
  const octave = Math.floor(roundedMidi / 12) - 1;
  return `${spellPitchClass(roundedMidi, preferFlats)}${octave}`;
}

/**
 * A non-zero key signature is authoritative. For scores without one, inspect
 * written accidentals because MIDI itself cannot distinguish A# from Bb.
 */
export function scorePrefersFlats(xml: string, fifths: number | null): boolean {
  if (fifths !== null && fifths !== 0) return fifths < 0;

  const flatAlters = xml.match(
    /<(?:\w+:)?alter\b[^>]*>\s*-\d+(?:\.\d+)?\s*<\/(?:\w+:)?alter>/gi,
  )?.length ?? 0;
  const sharpAlters = xml.match(
    /<(?:\w+:)?alter\b[^>]*>\s*\+?\d+(?:\.\d+)?\s*<\/(?:\w+:)?alter>/gi,
  )?.length ?? 0;
  const flatAccidentals = xml.match(
    /<(?:\w+:)?accidental\b[^>]*>\s*(?:flat|flat-flat)\s*<\/(?:\w+:)?accidental>/gi,
  )?.length ?? 0;
  const sharpAccidentals = xml.match(
    /<(?:\w+:)?accidental\b[^>]*>\s*(?:sharp|double-sharp)\s*<\/(?:\w+:)?accidental>/gi,
  )?.length ?? 0;

  return flatAlters + flatAccidentals > sharpAlters + sharpAccidentals;
}
