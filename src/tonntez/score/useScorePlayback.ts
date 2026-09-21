import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { AudioEngine } from "../core/AudioEngine";
import type { Score } from "./music";

export function useScorePlayback(
  score: Score | null,
  audioEngineRef: RefObject<AudioEngine>,
) {
  const frame = useRef(0);
  const generation = useRef(0);
  const offset = useRef(0);
  const anchor = useRef(0);
  const playing = useRef(false);
  const speedRef = useRef(1);
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");

  const silence = useCallback(() => {
    generation.current++;
    cancelAnimationFrame(frame.current);
    if (playing.current) audioEngineRef.current.releaseAll();
    playing.current = false;
  }, [audioEngineRef]);

  const pause = useCallback(() => {
    const engine = audioEngineRef.current;
    if (playing.current) {
      offset.current +=
        Math.max(0, engine.now() - anchor.current) * speedRef.current;
    }
    silence();
    setPosition(offset.current);
    setIsPlaying(false);
    setIsLoading(false);
  }, [audioEngineRef, silence]);

  const stop = useCallback(() => {
    silence();
    offset.current = 0;
    setPosition(0);
    setIsPlaying(false);
    setIsLoading(false);
  }, [silence]);

  const play = useCallback(async () => {
    if (!score || playing.current || isLoading) return;
    const request = ++generation.current;
    const engine = audioEngineRef.current;
    setIsLoading(true);
    setError("");
    try {
      await engine.ensureStarted();
      if (request !== generation.current) return;
      if (offset.current >= score.duration) offset.current = 0;
      engine.releaseAll();
      const start = engine.now() + 0.03;
      anchor.current = start;
      playing.current = true;
      setIsPlaying(true);
      score.notes.forEach((note) => {
        if (note.time + note.duration <= offset.current) return;
        const at =
          start + Math.max(0, note.time - offset.current) / speedRef.current;
        const end =
          start +
          (note.time + note.duration - offset.current) / speedRef.current;
        engine.attackRelease(
          note.name,
          Math.max(0.025, end - at),
          note.velocity,
          at,
        );
      });
      const tick = () => {
        const current = Math.min(
          score.duration,
          offset.current +
            Math.max(0, engine.now() - start) * speedRef.current,
        );
        setPosition(current);
        if (current >= score.duration) {
          silence();
          offset.current = score.duration;
          setIsPlaying(false);
        } else frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch {
      silence();
      setError("無法載入鋼琴音色，請再按一次播放。");
      setIsPlaying(false);
      playing.current = false;
    } finally {
      if (request === generation.current) setIsLoading(false);
    }
  }, [audioEngineRef, isLoading, score, silence]);

  const seek = useCallback(
    (seconds: number) => {
      pause();
      offset.current = Math.max(0, Math.min(seconds, score?.duration ?? 0));
      setPosition(offset.current);
    },
    [pause, score],
  );

  const changeSpeed = useCallback(
    (value: number) => {
      pause();
      speedRef.current = value;
      setSpeed(value);
    },
    [pause],
  );

  useEffect(() => {
    stop();
  }, [score, stop]);
  useEffect(() => () => silence(), [silence]);

  return {
    position,
    isPlaying,
    isLoading,
    speed,
    error,
    play,
    pause,
    stop,
    seek,
    changeSpeed,
  };
}
