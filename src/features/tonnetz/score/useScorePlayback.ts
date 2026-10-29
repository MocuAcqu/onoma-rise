import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ScorePianoEngine } from "../audio/ScorePianoEngine";
import type { Score } from "./music";
import { buildPlaybackBatches } from "./playbackScheduling";
import {
  eventAtPerformancePosition,
  type PerformanceTimeline,
} from "./performanceTimeline";
import { ScorePlaybackSynchronizer } from "./ScorePlaybackSynchronizer";

const START_DELAY_SECONDS = 0.1;
const SCHEDULE_LOOKAHEAD_SECONDS = 12;

export function useScorePlayback(
  score: Score | null,
  timeline: PerformanceTimeline | null,
  audioEngineRef: RefObject<ScorePianoEngine>,
) {
  const frame = useRef(0);
  const generation = useRef(0);
  const synchronizer = useRef(new ScorePlaybackSynchronizer());
  const renderedEventId = useRef<string | null>(null);
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");

  const silence = useCallback(() => {
    generation.current++;
    cancelAnimationFrame(frame.current);
    audioEngineRef.current.cancelScheduledPlayback();
  }, [audioEngineRef]);

  const pause = useCallback(() => {
    const engine = audioEngineRef.current;
    const sync = synchronizer.current;
    const pausedPosition = sync.isPlaying()
      ? sync.pause(engine.now())
      : sync.positionAt(engine.now());
    silence();
    setPosition(pausedPosition);
    setIsPlaying(false);
    setIsLoading(false);
  }, [audioEngineRef, silence]);

  const stop = useCallback(() => {
    silence();
    synchronizer.current.stop();
    renderedEventId.current = null;
    setPosition(0);
    setIsPlaying(false);
    setIsLoading(false);
  }, [silence]);

  const play = useCallback(async () => {
    if (!score || synchronizer.current.isPlaying() || isLoading) return;
    const request = ++generation.current;
    const engine = audioEngineRef.current;
    setIsLoading(true);
    setError("");
    try {
      await engine.ensureStarted();
      if (request !== generation.current) return;
      const sync = synchronizer.current;
      sync.setDuration(score.duration);
      if (sync.positionAt(engine.now()) >= score.duration) sync.seek(0);
      const startPosition = sync.positionAt(engine.now());
      renderedEventId.current = eventAtPerformancePosition(
        timeline,
        startPosition,
      )?.id ?? null;
      setPosition(startPosition);

      const batches = buildPlaybackBatches(
        timeline,
        startPosition,
        sync.getSpeed(),
      );
      engine.prepareScheduledPlayback(sync.getSpeed());
      let nextBatch = 0;
      const scheduleThrough = (maximumDelay: number) => {
        while (
          nextBatch < batches.length
          && batches[nextBatch].delay <= maximumDelay
        ) {
          const batch = batches[nextBatch++];
          engine.scheduleNoteBatch(
            batch.notes,
            batch.delay,
            batch.minimumDuration,
          );
        }
      };
      scheduleThrough(SCHEDULE_LOOKAHEAD_SECONDS);

      const start = engine.startScheduledPlayback(START_DELAY_SECONDS);
      sync.start(start);
      setIsPlaying(true);
      const tick = () => {
        const elapsed = Math.max(0, engine.now() - start);
        // All visual consumers read the score position derived from the same
        // Web Audio clock used to schedule the piano notes.
        const current = sync.positionAt(engine.now());
        scheduleThrough(elapsed + SCHEDULE_LOOKAHEAD_SECONDS);

        const eventId = eventAtPerformancePosition(timeline, current)?.id ?? null;
        if (eventId !== renderedEventId.current) {
          renderedEventId.current = eventId;
          setPosition(current);
        }
        if (current >= score.duration) {
          sync.pause(engine.now());
          silence();
          setPosition(score.duration);
          setIsPlaying(false);
        } else frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch {
      synchronizer.current.pause(engine.now());
      silence();
      setError("無法載入鋼琴音色，請再按一次播放。");
      setIsPlaying(false);
      setIsLoading(false);
    } finally {
      if (request === generation.current) setIsLoading(false);
    }
  }, [audioEngineRef, isLoading, score, silence, timeline]);

  const seek = useCallback((seconds: number) => {
    pause();
    const sync = synchronizer.current;
    sync.setDuration(score?.duration ?? 0);
    const nextPosition = sync.seek(seconds);
    renderedEventId.current = eventAtPerformancePosition(
      timeline,
      nextPosition,
    )?.id ?? null;
    setPosition(nextPosition);
  }, [pause, score, timeline]);

  const changeSpeed = useCallback((value: number) => {
    pause();
    synchronizer.current.setSpeed(value);
    setSpeed(value);
  }, [pause]);

  useEffect(() => { stop(); }, [score, stop]);
  useEffect(() => () => silence(), [silence]);

  const getPosition = useCallback(
    () => synchronizer.current.positionAt(audioEngineRef.current.now()),
    [audioEngineRef],
  );

  return {
    position,
    getPosition,
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
