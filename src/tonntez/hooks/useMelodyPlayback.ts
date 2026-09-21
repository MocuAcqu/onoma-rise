import { useCallback } from "react";
import type { Dispatch, RefObject } from "react";
import type { AudioEngine } from "../core/AudioEngine";
import type { Action, PlaybackMode, State } from "../store/playbackStore";
import type { MelodyEvent } from "../type";
import { useAudioPlayback } from "./useAudioPlayback";
import { useSynthPlayback } from "./useSynthPlayback";

type PlaybackState = Pick<State, "isPlayingMelody" | "isPaused" | "playbackMode">;

type Options = {
  melodyEvents: MelodyEvent[];
  state: PlaybackState;
  dispatch: Dispatch<Action>;
  audioEngineRef: RefObject<AudioEngine>;
  baseVelocity: number;
};

export function useMelodyPlayback({
  melodyEvents,
  state,
  dispatch,
  audioEngineRef,
  baseVelocity,
}: Options) {
  const {
    play: playAudio,
    pause: pauseAudio,
    resume: resumeAudio,
    stop: stopAudio,
    seekTo: seekAudio,
    setElement: setAudioElement,
    handlePlay: handleAudioPlay,
    handlePause: handleAudioPause,
    handleSeeked: handleAudioSeeked,
    handleEnded: handleAudioEnded,
  } = useAudioPlayback({ events: melodyEvents, state, dispatch });
  const {
    play: playSynth,
    pause: pauseSynth,
    resume: resumeSynth,
    stop: stopSynth,
  } = useSynthPlayback({
    events: melodyEvents,
    audioEngineRef,
    dispatch,
    baseVelocity,
  });

  const play = useCallback(async () => {
    if (state.isPlayingMelody || melodyEvents.length === 0) return;
    await audioEngineRef.current.ensureStarted();
    dispatch({ type: "MELODY_START" });

    if (state.playbackMode === "audio") {
      const started = await playAudio();
      if (!started) dispatch({ type: "MELODY_END" });
    } else {
      playSynth();
    }
  }, [audioEngineRef, dispatch, melodyEvents.length, playAudio, playSynth, state.isPlayingMelody, state.playbackMode]);

  const pause = useCallback(() => {
    if (!state.isPlayingMelody || state.isPaused) return;
    dispatch({ type: "MELODY_PAUSE" });
    if (state.playbackMode === "audio") pauseAudio();
    else pauseSynth();
  }, [dispatch, pauseAudio, pauseSynth, state.isPaused, state.isPlayingMelody, state.playbackMode]);

  const resume = useCallback(async () => {
    if (!state.isPlayingMelody || !state.isPaused) return;
    dispatch({ type: "MELODY_RESUME" });
    if (state.playbackMode === "audio") await resumeAudio();
    else resumeSynth();
  }, [dispatch, resumeAudio, resumeSynth, state.isPaused, state.isPlayingMelody, state.playbackMode]);

  const stop = useCallback(() => {
    if (state.playbackMode === "audio") stopAudio();
    else stopSynth();
    dispatch({ type: "MELODY_END" });
  }, [dispatch, state.playbackMode, stopAudio, stopSynth]);

  const changeMode = useCallback((mode: PlaybackMode) => {
    stop();
    dispatch({ type: "SET_PLAYBACK_MODE", mode });
  }, [dispatch, stop]);

  return {
    play,
    pause,
    resume,
    stop,
    seekAudio,
    changeMode,
    setAudioElement,
    handleAudioPlay,
    handleAudioPause,
    handleAudioSeeked,
    handleAudioEnded,
  };
}
