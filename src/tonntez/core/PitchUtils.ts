import { NUM_TO_PITCH, PITCH_TO_NUM } from "../constants";
import type { MelodyEvent, PitchClass } from "../type";

const FLAT_TO_SHARP: Record<string, PitchClass> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

class PitchUtils {
  static mod12(n: number): number {
    return ((n % 12) + 12) % 12;
  }

  static buildNote(pitch: PitchClass, octave: number): string {
    return `${pitch}${octave}`;
  }

  static toPitchClass(input: string): PitchClass | null {
    const match = input.trim().match(/^([A-G](?:#|b)?)/);
    if (!match) return null;

    const pitch = FLAT_TO_SHARP[match[1]] ?? match[1];
    return pitch in PITCH_TO_NUM ? (pitch as PitchClass) : null;
  }

  static getMelodyPitchClass(event: MelodyEvent): PitchClass | null {
    if (typeof event.midi === "number" && Number.isFinite(event.midi)) {
      return NUM_TO_PITCH[PitchUtils.mod12(Math.round(event.midi))];
    }

    return (
      PitchUtils.toPitchClass(event.pitch) ??
      (event.note ? PitchUtils.toPitchClass(event.note) : null)
    );
  }

  static getMelodyNote(event: MelodyEvent, fallbackOctave: number): string {
    if (event.note) return event.note;
    if (/\d$/.test(event.pitch)) return event.pitch;

    const pitchClass = PitchUtils.getMelodyPitchClass(event);
    return pitchClass
      ? PitchUtils.buildNote(pitchClass, fallbackOctave)
      : event.pitch;
  }

  static getPitchAt(q: number, r: number, root: PitchClass = "C"): PitchClass {
    const rootNum = PITCH_TO_NUM[root];
    return NUM_TO_PITCH[PitchUtils.mod12(rootNum + 7 * q + 4 * r)];
  }

  static getChordKey(chord: PitchClass[]): string {
    return [...chord].sort().join("-");
  }

  static getChordName(triangle: { chord: PitchClass[]; type: string }): string {
    return `${triangle.chord[0]} ${triangle.type}`;
  }

  static formatTime(sec: number): string {
    return `${sec.toFixed(1)}s`;
  }
}

export default PitchUtils;
