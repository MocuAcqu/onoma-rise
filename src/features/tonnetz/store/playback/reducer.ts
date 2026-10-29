import type { Action, State } from "./types";

export function playbackReducer(state: State, action: Action): State {
  switch (action.type) {
    case "PRESS_PITCH": {
      const played = Array.from(new Set([...state.playedPitchClasses, action.pitch]));
      return {
        ...state,
        focusedNodeIndex: action.index,
        focusedPitchClasses: played,
        playedPitchClasses: played,
        activeChordKey: null,
        selectionInfo: { kind: "note", label: action.pitch, note: action.note },
      };
    }
    case "RELEASE_PITCH": {
      const remaining = state.playedPitchClasses.filter((pitch) => pitch !== action.pitch);
      return {
        ...state,
        focusedPitchClasses: remaining,
        playedPitchClasses: remaining,
        focusedNodeIndex: remaining.length ? state.focusedNodeIndex : null,
        selectionInfo: remaining.length ? state.selectionInfo : null,
      };
    }
    case "PLAY_CHORD":
      return {
        ...state,
        activeChordKey: action.chordKey,
        focusedNodeIndex: null,
        focusedPitchClasses: action.chord,
        playedPitchClasses: [],
        selectionInfo: action.selectionInfo,
        selectedDiamondPitchSet: null,
      };
    case "CLEAR_CHORD":
      return { ...state, focusedPitchClasses: [], playedPitchClasses: [], activeChordKey: null };
    case "MELODY_START":
      return {
        ...state,
        isPlayingMelody: true,
        isPaused: false,
        playedPitchClasses: [],
        focusedPitchClasses: [],
        focusedNodeIndex: null,
        activeChordKey: null,
        activeMelodyEventId: null,
        playbackMelodyEventId: null,
      };
    case "MELODY_PAUSE":
      return { ...state, isPaused: true };
    case "MELODY_RESUME":
      return { ...state, isPaused: false };
    case "MELODY_STEP":
      return {
        ...state,
        playbackMelodyEventId: action.eventId,
        playedPitchClasses: [action.pitch],
        selectionInfo: { kind: "note", label: action.pitch, note: action.note },
      };
    case "PLAYBACK_FRAME":
      return {
        ...state,
        playbackMelodyEventId: action.eventId,
        playbackTime: action.currentTime,
        playedPitchClasses: action.pitches,
        selectionInfo: action.note && action.pitches[0]
          ? { kind: "note", label: action.pitches[0], note: action.note }
          : state.selectionInfo,
      };
    case "MELODY_END":
      return {
        ...state,
        playedPitchClasses: [],
        playbackMelodyEventId: null,
        playbackTime: 0,
        isPlayingMelody: false,
        isPaused: false,
      };
    case "TIMELINE_CLICK":
      return {
        ...state,
        activeMelodyEventId: action.eventId,
        activeChordKey: null,
        focusedPitchClasses: [],
        focusedNodeIndex: null,
        playedPitchClasses: [action.pitch],
        selectionInfo: { kind: "note", label: action.pitch, note: action.note },
      };
    case "TIMELINE_CLEAR":
      return { ...state, playedPitchClasses: [], activeMelodyEventId: null };
    case "SET_OCTAVE":
      return { ...state, currentOctave: Math.max(2, Math.min(action.value, 6)) };
    case "FLASH_EDGE":
      return {
        ...state,
        activeEdgeKey: action.key,
        activeEdgePitchPair: action.pitchPair,
        focusedPitchClasses: Array.from(new Set([...state.focusedPitchClasses, ...action.pitchPair])),
      };
    case "CLEAR_EDGE":
      return {
        ...state,
        activeEdgeKey: state.activeEdgeKey === action.key ? null : state.activeEdgeKey,
        activeEdgePitchPair: null,
        focusedPitchClasses: [],
      };
    case "SET_SUSTAIN":
      return { ...state, isSustain: action.value };
    case "SET_ACCENT":
      return { ...state, accentMode: action.mode, accentActivePitch: action.pitch };
    case "SET_DIAMOND_SET":
      return {
        ...state,
        selectedDiamondPitchSet: action.pitchSet,
        activeChordKey: null,
        focusedPitchClasses: action.pitchSet,
        playedPitchClasses: [],
        focusedNodeIndex: null,
      };
    case "RESET_DIAMOND_SET":
      return { ...state, selectedDiamondPitchSet: null };
    case "CLEAR_DIAMOND_SET":
      return {
        ...state,
        selectedDiamondPitchSet: null,
        focusedPitchClasses: [],
        selectionInfo: null,
      };
    case "SET_PLAYBACK_MODE":
      return { ...state, playbackMode: action.mode };
    default:
      return state;
  }
}
