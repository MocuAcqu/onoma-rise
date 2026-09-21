import type { PitchClass, SelectionInfo } from "../../type";

export type TransformMode = "basic" | "P" | "L" | "R";
export type AccentMode = null | "," | ".";
export type PlaybackMode = "audio" | "synth";

export type State = {
  focusedNodeIndex: number | null;
  focusedPitchClasses: PitchClass[];
  playedPitchClasses: PitchClass[];
  activeChordKey: string | null;
  selectionInfo: SelectionInfo;
  activeMelodyEventId: string | null;
  playbackMelodyEventId: string | null;
  playbackTime: number;
  isPlayingMelody: boolean;
  isPaused: boolean;
  playbackMode: PlaybackMode;
  currentOctave: number;
  activeEdgeKey: string | null;
  activeEdgePitchPair: [PitchClass, PitchClass] | null;
  isSustain: boolean;
  accentMode: AccentMode;
  accentActivePitch: PitchClass | null;
  selectedDiamondPitchSet: PitchClass[] | null;
};

export type Action =
  | { type: "PRESS_PITCH"; pitch: PitchClass; index: number; note: string }
  | { type: "RELEASE_PITCH"; pitch: PitchClass }
  | { type: "PLAY_CHORD"; chordKey: string; chord: PitchClass[]; selectionInfo: SelectionInfo }
  | { type: "CLEAR_CHORD" }
  | { type: "MELODY_START" }
  | { type: "MELODY_STEP"; eventId: string; pitch: PitchClass; note: string }
  | { type: "PLAYBACK_FRAME"; eventId: string | null; pitches: PitchClass[]; note: string | null; currentTime: number }
  | { type: "MELODY_END" }
  | { type: "MELODY_PAUSE" }
  | { type: "MELODY_RESUME" }
  | { type: "TIMELINE_CLICK"; eventId: string; pitch: PitchClass; note: string }
  | { type: "TIMELINE_CLEAR" }
  | { type: "SET_OCTAVE"; value: number }
  | { type: "FLASH_EDGE"; key: string; pitchPair: [PitchClass, PitchClass] }
  | { type: "CLEAR_EDGE"; key: string }
  | { type: "SET_SUSTAIN"; value: boolean }
  | { type: "SET_ACCENT"; mode: AccentMode; pitch: PitchClass | null }
  | { type: "SET_DIAMOND_SET"; pitchSet: PitchClass[] }
  | { type: "RESET_DIAMOND_SET" }
  | { type: "CLEAR_DIAMOND_SET" }
  | { type: "SET_PLAYBACK_MODE"; mode: PlaybackMode };
