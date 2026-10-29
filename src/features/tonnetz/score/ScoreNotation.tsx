import { useEffect, useRef, useState } from "react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import type { Score } from "./music";

type OsmdModule = typeof import("opensheetmusicdisplay");

// Start downloading OSMD as soon as the Tonnetz route is evaluated. By the
// time a recognition job finishes, the large renderer module is normally
// already warm instead of being initialized during the first score render.
const osmdModule = import("opensheetmusicdisplay").then((importedOsmd) => (
  (importedOsmd as unknown as { default?: OsmdModule }).default ?? importedOsmd
));

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForLayout(
  host: HTMLElement,
  isCancelled: () => boolean,
) {
  // React may mount the score in the same commit that switches workspace
  // modes. Give layout a few frames to assign a real width before OSMD reads it.
  for (let frame = 0; frame < 10; frame += 1) {
    await nextFrame();
    if (isCancelled()) return false;
    if (host.isConnected && host.getBoundingClientRect().width > 1) return true;
  }
  return false;
}

async function waitForFonts() {
  if (!("fonts" in document)) return;
  // A broken remote font must not hold the score forever. OSMD can still fall
  // back to its bundled glyphs after this short cold-start grace period.
  await Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 500)),
  ]);
}

type Props = {
  score: Score;
  positionBeat: number;
  onNoteSelect: (beat: number) => void;
};

export function ScoreNotation({ score, positionBeat, onNoteSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const displayRef = useRef<OpenSheetMusicDisplay | null>(null);
  const onNoteSelectRef = useRef(onNoteSelect);
  const timings = useRef<number[]>([]);
  const index = useRef(0);
  const [ready, setReady] = useState(false);
  const [cursorReady, setCursorReady] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  useEffect(() => {
    onNoteSelectRef.current = onNoteSelect;
  }, [onNoteSelect]);
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    const host = document.createElement("div");
    container.current!.replaceChildren(host);
    setReady(false);
    setCursorReady(false);
    setError("");
    setWarning("");
    void (async () => {
      let osmd: OsmdModule;
      try {
        osmd = await osmdModule;
      } catch (cause) {
        console.error("OSMD 模組載入失敗", cause);
        if (!cancelled) setError("五線譜排版工具載入失敗，請重新整理後再試。");
        return;
      }
      if (cancelled) return;

      const { CursorType, OpenSheetMusicDisplay, PointF2D } = osmd;
      const display = new OpenSheetMusicDisplay(host, {
        backend: "svg", autoResize: false, drawTitle: false, drawPartNames: false,
        drawingParameters: "compact", autoBeam: true,
        autoBeamOptions: { beam_rests: false, beam_middle_rests_only: false, maintain_stem_directions: false },
        cursorsOptions: [{ type: CursorType.Standard, color: "#a855f7", alpha: 0.24, follow: false }],
      });

      try {
        await display.load(score.xml);
      } catch (cause) {
        console.error("OSMD MusicXML 載入失敗", cause);
        if (!cancelled) setError("辨識完成，但 MusicXML 無法載入五線譜。");
        return;
      }
      if (cancelled) return;

      await waitForFonts();
      const hasLayout = await waitForLayout(host, () => cancelled);
      if (cancelled) return;
      if (!hasLayout) {
        setError("五線譜區域尚未完成版面配置，請重新顯示樂譜。");
        return;
      }

      display.zoom = 0.85;
      let rendered = false;
      let renderCause: unknown;
      // Retry the layout once after two paints, but keep the successfully
      // parsed MusicXML and the current OSMD instance.
      for (let attempt = 0; attempt < 2 && !rendered; attempt += 1) {
        try {
          display.render();
          rendered = true;
        } catch (cause) {
          renderCause = cause;
          if (attempt === 0) {
            await nextFrame();
            await nextFrame();
          }
        }
      }
      if (cancelled) return;
      if (!rendered) {
        console.error("OSMD 五線譜排版失敗", renderCause);
        setError("五線譜無法排版，仍可播放並查看 Tonnetz。");
        return;
      }

      displayRef.current = display;
      setReady(true);

      let cursorAvailable = false;
      try {
        const cursor = display.cursor;
        cursor.reset();
        const times: number[] = [];
        while (!cursor.Iterator.EndReached && times.length < 100000) {
          times.push(cursor.Iterator.CurrentSourceTimestamp.RealValue * 4);
          cursor.next();
        }
        timings.current = times;
        index.current = 0;
        cursor.reset();
        cursor.show();
        cursorAvailable = true;
        setCursorReady(true);
      } catch (cause) {
        // The rendered notation remains useful even if OSMD cannot construct a
        // playback cursor for an unusual recognized measure.
        console.warn("OSMD 播放游標初始化失敗", cause);
        setWarning("五線譜已顯示，但播放游標暫時無法使用。");
      }

      const handleScoreClick = (event: MouseEvent) => {
        // OSMD's hit test works in its own engraving coordinate system.
        // Keep the radius small so blank staff space does not seek playback.
        const domPoint = new PointF2D(event.clientX, event.clientY);
        const svgPoint = display.GraphicSheet.domToSvg(domPoint);
        const sheetPoint = display.GraphicSheet.svgToOsmd(svgPoint);
        const note = display.GraphicSheet.GetNearestNote(
          sheetPoint,
          new PointF2D(1.5, 1.5),
        );
        if (!note?.sourceNote || note.sourceNote.isRest()) return;
        const beat = note.sourceNote.getAbsoluteTimestamp().RealValue * 4;
        if (Number.isFinite(beat)) onNoteSelectRef.current(beat);
      };
      host.addEventListener("click", handleScoreClick);
      let width = host.clientWidth;
      observer = new ResizeObserver(() => {
        if (host.clientWidth <= 0 || host.clientWidth === width) return;
        width = host.clientWidth;
        if (cancelled) return;
        try {
          display.render();
          if (cursorAvailable) display.cursor.update();
        } catch (cause) {
          // Keep the last successful SVG instead of replacing it with the
          // generic recognition fallback because of a resize-only failure.
          console.warn("OSMD 尺寸變更後重新排版失敗", cause);
        }
      });
      observer.observe(host);
    })();
    return () => { cancelled = true; observer?.disconnect(); displayRef.current = null; host.remove(); };
  }, [score]);
  useEffect(() => {
    const cursor = displayRef.current?.cursor;
    if (!ready || !cursorReady || !cursor) return;
    try {
      let low = 0;
      let high = timings.current.length;
      const threshold = positionBeat + 0.015;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (timings.current[middle] <= threshold) low = middle + 1;
        else high = middle;
      }
      const target = Math.max(0, low - 1);
      if (target < index.current) { cursor.reset(); index.current = 0; }
      while (index.current < target) { cursor.next(); index.current++; }
      cursor.show();
      const viewport = container.current;
      if (viewport) {
        const rect = cursor.cursorElement.getBoundingClientRect();
        const bounds = viewport.getBoundingClientRect();
        if (Number.isFinite(rect.top) && (rect.width > 0 || rect.height > 0) && (rect.bottom > bounds.bottom || rect.top < bounds.top)) {
          const desired = viewport.scrollTop + rect.top - bounds.top - 30;
          const maximum = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
          viewport.scrollTop = Math.min(maximum, Math.max(0, desired));
        }
      }
    } catch (cause) {
      console.warn("OSMD 播放游標更新失敗", cause);
      setCursorReady(false);
      setWarning("五線譜已顯示，但播放游標暫時無法使用。");
    }
  }, [cursorReady, positionBeat, ready]);
  return <>{!ready && !error && <p className="score-hint">正在排版五線譜…</p>}{error && <p role="alert">{error}</p>}{warning && <p className="score-hint">{warning}</p>}<div className="score-notation" ref={container} /></>;
}
