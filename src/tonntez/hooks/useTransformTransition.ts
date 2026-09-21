import { useCallback, useEffect, useRef, useState } from "react";

export type TransformMode = "basic" | "P" | "L" | "R";
export type TransformFrame = 1 | 2 | 3;

const FRAME_MS = 95;

export function useTransformTransition(
  onCommitMode: (mode: TransformMode) => void
) {
  const [transitionFrame, setTransitionFrame] = useState<TransformFrame | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayMode, setDisplayMode] = useState<TransformMode>("basic");

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const triggerTransformTransition = useCallback(
    (nextMode: TransformMode) => {
      clearTimers();

      setIsTransitioning(true);
      setTransitionFrame(1);

      const t1 = window.setTimeout(() => {
        setTransitionFrame(2);
        setDisplayMode(nextMode);
        onCommitMode(nextMode);
      }, FRAME_MS);

      const t2 = window.setTimeout(() => {
        setTransitionFrame(3);
      }, FRAME_MS * 2);

      const t3 = window.setTimeout(() => {
        setTransitionFrame(null);
        setIsTransitioning(false);
      }, FRAME_MS * 3);

      timersRef.current = [t1, t2, t3];
    },
    [clearTimers, onCommitMode]
  );

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    transitionFrame,
    isTransitioning,
    displayMode,
    triggerTransformTransition,
  };
}