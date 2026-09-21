import { useCallback, useEffect, useRef, useState } from "react";
import type { PitchClass } from "../type";

export type NodeAnimFrame = 1 | 2 | 3;
export type NodeAnimMap = Partial<Record<PitchClass, NodeAnimFrame>>;

const FRAME_MS = 70;

export function useNodeFrameAnimation() {
  const [nodeFrames, setNodeFrames] = useState<NodeAnimMap>({});
  const timersRef = useRef<Partial<Record<PitchClass, number[]>>>({});

  const clearNodeTimers = useCallback((pitch: PitchClass) => {
    const timers = timersRef.current[pitch];
    if (timers) {
      timers.forEach(id => window.clearTimeout(id));
      delete timersRef.current[pitch];
    }
  }, []);

  const triggerNodeAnimation = useCallback((pitch: PitchClass) => {
    clearNodeTimers(pitch);

    setNodeFrames(prev => ({ ...prev, [pitch]: 1 }));

    const t1 = window.setTimeout(() => {
      setNodeFrames(prev => ({ ...prev, [pitch]: 2 }));
    }, FRAME_MS);

    const t2 = window.setTimeout(() => {
      setNodeFrames(prev => ({ ...prev, [pitch]: 3 }));
    }, FRAME_MS * 2);

    const t3 = window.setTimeout(() => {
      setNodeFrames(prev => {
        const next = { ...prev };
        delete next[pitch];
        return next;
      });
      delete timersRef.current[pitch];
    }, FRAME_MS * 3);

    timersRef.current[pitch] = [t1, t2, t3];
  }, [clearNodeTimers]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(arr => {
        arr?.forEach(id => window.clearTimeout(id));
      });
    };
  }, []);

  return {
    nodeFrames,
    triggerNodeAnimation,
  };
}
