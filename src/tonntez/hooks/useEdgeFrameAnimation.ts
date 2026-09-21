import { useCallback, useEffect, useRef, useState } from "react";

export type EdgeAnimFrame = 1 | 2 | 3 | 4;
export type EdgeAnimMap = Record<string, EdgeAnimFrame>;

const FRAME_MS = 55;

export function useEdgeFrameAnimation() {
  const [edgeFrames, setEdgeFrames] = useState<EdgeAnimMap>({});
  const timersRef = useRef<Record<string, number[]>>({});

  const clearEdgeTimers = useCallback((key: string) => {
    const timers = timersRef.current[key];
    if (timers) {
      timers.forEach(id => window.clearTimeout(id));
      delete timersRef.current[key];
    }
  }, []);

  const triggerEdgeAnimation = useCallback((key: string) => {
    clearEdgeTimers(key);

    setEdgeFrames(prev => ({ ...prev, [key]: 1 }));

    const t1 = window.setTimeout(() => {
      setEdgeFrames(prev => ({ ...prev, [key]: 2 }));
    }, FRAME_MS);

    const t2 = window.setTimeout(() => {
      setEdgeFrames(prev => ({ ...prev, [key]: 3 }));
    }, FRAME_MS * 2);

    const t3 = window.setTimeout(() => {
      setEdgeFrames(prev => ({ ...prev, [key]: 4 }));
    }, FRAME_MS * 3);

    const t4 = window.setTimeout(() => {
      setEdgeFrames(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete timersRef.current[key];
    }, FRAME_MS * 4);

    timersRef.current[key] = [t1, t2, t3, t4];
  }, [clearEdgeTimers]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(arr => {
        arr.forEach(id => window.clearTimeout(id));
      });
    };
  }, []);

  return {
    edgeFrames,
    triggerEdgeAnimation,
  };
}
