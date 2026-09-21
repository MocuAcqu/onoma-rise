import { useEffect, useRef, useState } from "react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import type { Score } from "./music";

export function ScoreNotation({
  score,
  positionBeat,
}: {
  score: Score;
  positionBeat: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const displayRef = useRef<OpenSheetMusicDisplay | null>(null);
  const timings = useRef<number[]>([]);
  const index = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    const host = document.createElement("div");
    container.current!.replaceChildren(host);
    setReady(false);
    setError("");
    void (async () => {
      try {
        const { CursorType, OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        if (cancelled) return;
        const display = new OpenSheetMusicDisplay(host, {
          backend: "svg",
          autoResize: false,
          drawTitle: false,
          drawPartNames: false,
          drawingParameters: "compact",
          autoBeam: true,
          autoBeamOptions: {
            beam_rests: false,
            beam_middle_rests_only: false,
            maintain_stem_directions: false,
          },
          cursorsOptions: [
            {
              type: CursorType.Standard,
              color: "#a855f7",
              alpha: 0.24,
              follow: false,
            },
          ],
        });
        await display.load(score.xml);
        if (cancelled) return;
        display.zoom = 0.85;
        display.render();
        displayRef.current = display;
        const cursor = display.cursor;
        cursor.reset();
        const times: number[] = [];
        while (!cursor.Iterator.EndReached && times.length < 100000) {
          times.push(
            cursor.Iterator.CurrentSourceTimestamp.RealValue * 4,
          );
          cursor.next();
        }
        timings.current = times;
        index.current = 0;
        cursor.reset();
        cursor.show();
        setReady(true);
        let width = host.clientWidth;
        observer = new ResizeObserver(() => {
          if (host.clientWidth > 0 && host.clientWidth !== width) {
            width = host.clientWidth;
            display.render();
            display.cursor.update();
          }
        });
        observer.observe(host);
      } catch {
        if (!cancelled) setError("五線譜無法排版，仍可播放並查看 Tonnetz。");
      }
    })();
    return () => {
      cancelled = true;
      observer?.disconnect();
      displayRef.current = null;
      host.remove();
    };
  }, [score]);
  useEffect(() => {
    const cursor = displayRef.current?.cursor;
    if (!ready || !cursor) return;
    let target = 0;
    while (
      target + 1 < timings.current.length &&
      timings.current[target + 1] <= positionBeat + 0.015
    )
      target++;
    if (target < index.current) {
      cursor.reset();
      index.current = 0;
    }
    while (index.current < target) {
      cursor.next();
      index.current++;
    }
    cursor.show();
    const viewport = container.current;
    if (viewport) {
      const rect = cursor.cursorElement.getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      if (
        Number.isFinite(rect.top) &&
        (rect.width > 0 || rect.height > 0) &&
        (rect.bottom > bounds.bottom || rect.top < bounds.top)
      ) {
        const desired = viewport.scrollTop + rect.top - bounds.top - 30;
        const maximum = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        viewport.scrollTop = Math.min(maximum, Math.max(0, desired));
      }
    }
  }, [positionBeat, ready]);
  return (
    <>
      {!ready && !error && <p className="score-hint">正在排版五線譜…</p>}
      {error && <p role="alert">{error}</p>}
      <div className="score-notation" ref={container} />
    </>
  );
}
