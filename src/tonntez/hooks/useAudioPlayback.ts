import { useCallback, useEffect, useRef } from "react";
import type { Dispatch } from "react";
import { AudioTimelineSynchronizer } from "../core/AudioTimelineSynchronizer";
import PitchUtils from "../core/PitchUtils";
import type { Action, State } from "../store/playbackStore";
import type { MelodyEvent, PitchClass } from "../type";

type PlaybackState = Pick<State, "isPlayingMelody" | "isPaused" | "playbackMode">;

type Options = {
  events: MelodyEvent[];
  state: PlaybackState;
  dispatch: Dispatch<Action>;
};

export function useAudioPlayback({ events, state, dispatch }: Options) {
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const pausedAtRef = useRef(0);
  const synchronizerRef = useRef(new AudioTimelineSynchronizer());

  const dispatchFrame = useCallback((activeEvents: MelodyEvent[], currentTime: number) => {
    const pitches = Array.from(new Set(activeEvents
      .map((event) => PitchUtils.getMelodyPitchClass(event))
      .filter((pitch): pitch is PitchClass => pitch !== null)));
    // 複音事件可能長時間重疊；用最近開始的音符推進 Timeline，
    // Tonnetz 的 pitches 仍保留當下全部發聲音級。
    const event = activeEvents.reduce<MelodyEvent | null>(
      (latest, candidate) => !latest || candidate.start > latest.start ? candidate : latest,
      null,
    );
    dispatch({
      type: "PLAYBACK_FRAME",
      eventId: event?.id ?? null,
      pitches,
      note: event ? PitchUtils.getMelodyNote(event, 4) : null,
      currentTime,
    });
  }, [dispatch]);

  const startSync = useCallback((element: HTMLAudioElement) => {
    synchronizerRef.current.start(
      element,
      events,
      dispatchFrame,
      () => dispatch({ type: "MELODY_END" }),
    );
  }, [dispatch, dispatchFrame, events]);

  const stopSync = useCallback(() => synchronizerRef.current.stop(), []);

  const play = useCallback(async () => {
    const element = elementRef.current;
    if (!element) return false;
    element.currentTime = 0;
    await element.play().catch(() => undefined);
    return true;
  }, []);

  const pause = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      pausedAtRef.current = element.currentTime;
      element.pause();
    }
    stopSync();
  }, [stopSync]);

  const resume = useCallback(async () => {
    const element = elementRef.current;
    if (!element) return;
    element.currentTime = pausedAtRef.current;
    await element.play().catch(() => undefined);
  }, []);

  const stop = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      element.pause();
      element.currentTime = 0;
    }
    pausedAtRef.current = 0;
    stopSync();
  }, [stopSync]);

  const seekTo = useCallback((time: number) => {
    const element = elementRef.current;
    if (!element) return;
    const duration = Number.isFinite(element.duration) ? element.duration : time;
    element.currentTime = Math.max(0, Math.min(time, duration));
    pausedAtRef.current = element.currentTime;
    startSync(element);
  }, [startSync]);

  const setElement = useCallback((element: HTMLAudioElement | null) => {
    elementRef.current = element;
  }, []);

  const handlePlay = useCallback((element: HTMLAudioElement) => {
    if (state.playbackMode !== "audio") return;
    elementRef.current = element;
    pausedAtRef.current = element.currentTime;
    if (!state.isPlayingMelody) dispatch({ type: "MELODY_START" });
    else if (state.isPaused) dispatch({ type: "MELODY_RESUME" });
    startSync(element);
  }, [dispatch, startSync, state.isPaused, state.isPlayingMelody, state.playbackMode]);

  const handlePause = useCallback((element: HTMLAudioElement) => {
    if (state.playbackMode !== "audio" || element.ended) return;
    pausedAtRef.current = element.currentTime;
    stopSync();
    if (state.isPlayingMelody && !state.isPaused) dispatch({ type: "MELODY_PAUSE" });
  }, [dispatch, state.isPaused, state.isPlayingMelody, state.playbackMode, stopSync]);

  const handleSeeked = useCallback((element: HTMLAudioElement) => {
    if (state.playbackMode !== "audio") return;
    pausedAtRef.current = element.currentTime;
    startSync(element);
  }, [startSync, state.playbackMode]);

  const handleEnded = useCallback(() => {
    pausedAtRef.current = 0;
    stopSync();
    dispatch({ type: "MELODY_END" });
  }, [dispatch, stopSync]);

  useEffect(() => stopSync, [stopSync]);

  return {
    play,
    pause,
    resume,
    stop,
    seekTo,
    setElement,
    handlePlay,
    handlePause,
    handleSeeked,
    handleEnded,
  };
}
