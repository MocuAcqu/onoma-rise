export type PitchClass =
  | "C" | "C#" | "D" | "D#" | "E" | "F"
  | "F#" | "G" | "G#" | "A" | "A#" | "B";

export type MelodyEvent = {
  id: string;
  pitch: string;
  start: number;
  end: number;
  midi?: number;
  note?: string;
  confidence?: number;
  frequencyHz?: number;
  detectedFrequencyHz?: number;
};

export type ChordEvent = {
  id: string;
  start: number;
  end: number;
  name: string;
  root: PitchClass | null;
  notes: PitchClass[];
  confidence: number;
};

export type KeyEstimate = {
  key: string;
  tonic: PitchClass | null;
  mode: "major" | "minor" | null;
  confidence: number;
};

export type TranscriptionAnalysis = {
  events: MelodyEvent[];
  chords: ChordEvent[];
  estimatedKey: KeyEstimate | null;
};
