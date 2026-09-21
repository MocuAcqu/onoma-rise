import type { State } from "./types";

export const INITIAL_STATE: State = {
  focusedNodeIndex: null,
  focusedPitchClasses: [],
  playedPitchClasses: [],
  activeChordKey: null,
  selectionInfo: null,
  activeMelodyEventId: null,
  playbackMelodyEventId: null,
  playbackTime: 0,
  isPlayingMelody: false,
  isPaused: false,
  playbackMode: "audio",
  currentOctave: 4,
  activeEdgeKey: null,
  activeEdgePitchPair: null,
  isSustain: false,
  accentMode: null,
  accentActivePitch: null,
  selectedDiamondPitchSet: null,
};
