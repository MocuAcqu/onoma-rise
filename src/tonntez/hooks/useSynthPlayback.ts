import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, RefObject } from "react";
import type { AudioEngine } from "../core/AudioEngine";
import PitchUtils from "../core/PitchUtils";
import type { Action } from "../store/playbackStore";
import type { MelodyEvent } from "../type";

type Options = {
  events: MelodyEvent[];
  audioEngineRef: RefObject<AudioEngine>;
  dispatch: Dispatch<Action>;
  baseVelocity: number;
};

export function useSynthPlayback({ events, audioEngineRef, dispatch, baseVelocity }: Options) {
  const elapsedSecondsRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((offsetMs: number) => {
    clearTimers();
    const timerIds: number[] = [];
    const startWallTime = performance.now();

    events.forEach((event) => {
      const startMs = event.start * 1000;
      if (event.end * 1000 <= offsetMs) return;

      timerIds.push(window.setTimeout(() => {
        const pitch = PitchUtils.getMelodyPitchClass(event);
        if (!pitch) return;
        const note = PitchUtils.getMelodyNote(event, 4);
        dispatch({ type: "MELODY_STEP", eventId: event.id, pitch, note });
        audioEngineRef.current.attackRelease(note, 0.25, baseVelocity);
      }, Math.max(0, startMs - offsetMs)));
    });

    const durationMs = (events.at(-1)?.end ?? 0) * 1000;
    timerIds.push(window.setTimeout(() => {
      dispatch({ type: "MELODY_END" });
      clearTimers();
    }, Math.max(0, durationMs - offsetMs)));

    elapsedSecondsRef.current = offsetMs / 1000;
    timerIds.push(window.setInterval(() => {
      elapsedSecondsRef.current = offsetMs / 1000 +
        (performance.now() - startWallTime) / 1000;
    }, 50));
    timersRef.current = timerIds;
  }, [audioEngineRef, baseVelocity, clearTimers, dispatch, events]);

  const play = useCallback(() => {
    elapsedSecondsRef.current = 0;
    schedule(0);
  }, [schedule]);

  const pause = clearTimers;

  const resume = useCallback(() => {
    schedule(elapsedSecondsRef.current * 1000);
  }, [schedule]);

  const stop = useCallback(() => {
    clearTimers();
    elapsedSecondsRef.current = 0;
  }, [clearTimers]);

  useEffect(() => stop, [stop]);

  return { play, pause, resume, stop };
}
