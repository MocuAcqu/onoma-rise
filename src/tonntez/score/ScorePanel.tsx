import { useRef, useState } from "react";
import { ScoreNotation } from "./ScoreNotation";
import { time } from "./music";
import type { useScoreImport } from "./useScoreImport";
import type { useScorePlayback } from "./useScorePlayback";
import "./score.css";

type Props = {
  playbackDuration: number;
  notationPosition: number;
  importer: ReturnType<typeof useScoreImport>;
  player: ReturnType<typeof useScorePlayback>;
};
export function ScorePanel({
  importer,
  player,
  playbackDuration,
  notationPosition,
}: Props) {
  const file = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { score, title, busy, job, error } = importer;
  const chooseFile = () => {
    if (!busy) file.current?.click();
  };
  const upload = (selected?: File) => {
    if (selected && !busy) void importer.upload(selected);
  };
  return (
    <section
      className={`score-panel${expanded ? " score-expanded" : ""}`}
      aria-label="樂譜工作區"
    >
      <header className="score-header">
        <div>
          <span className="score-eyebrow">樂譜辨識</span>
          <h3>{score ? title : "上傳檔案"}</h3>
          <p className="score-hint">
            {score
              ? `${score.tracks} 個聲部 · ${score.notes.length} 個音符`
              : "上傳圖片或 PDF 檔案以辨識樂譜"}
          </p>
        </div>
        <div className="score-actions">
          <button
            className="score-button score-primary"
            disabled={busy}
            onClick={chooseFile}
          >
            匯入樂譜
          </button>
          <button
            className="score-button"
            disabled={busy}
            onClick={importer.demo}
          >
            查看範例
          </button>
        </div>
        <input
          ref={file}
          hidden
          type="file"
          accept=".png,.pdf"
          disabled={busy}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = "";
            upload(selected);
          }}
        />
      </header>
      {busy && (
        <div className="score-status" role="status">
          <span>
            {job?.stage || "正在上傳樂譜…"} {job ? `${job.percent}%` : ""}
          </span>
          <progress max={100} value={job?.percent ?? 0} aria-label="辨識進度" />
          {job && (
            <button
              className="score-button"
              onClick={() => void importer.cancel()}
              disabled={job.status === "cancelling"}
            >
              取消辨識
            </button>
          )}
        </div>
      )}
      {(error || player.error) && (
        <p className="score-error" role="alert">
          {error || player.error}
        </p>
      )}
      {score ? (
        <>
          <div className="score-controls">
            <button
              className="score-button score-primary"
              disabled={player.isLoading}
              onClick={() =>
                player.isPlaying ? player.pause() : void player.play()
              }
            >
              {player.isLoading
                ? "載入鋼琴…"
                : player.isPlaying
                  ? "暫停"
                  : "播放"}
            </button>
            <button className="score-button" onClick={player.stop}>
              停止
            </button>
            <input
              aria-label="樂譜播放進度"
              type="range"
              min={0}
              max={playbackDuration}
              step={0.01}
              value={player.position}
              onChange={(event) => player.seek(Number(event.target.value))}
            />
            <span className="score-time">
              {time(player.position)} / {time(playbackDuration)}
            </span>
            <select
              aria-label="樂譜播放速度"
              value={player.speed}
              onChange={(event) =>
                player.changeSpeed(Number(event.target.value))
              }
            >
              {[0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
                <option key={speed} value={speed}>
                  {speed}×
                </option>
              ))}
            </select>
          </div>
          <div className="score-section-heading">
            <span>
              五線譜 
            </span>
            <div className="score-actions">
              {!collapsed && (
                <button
                  className="score-button"
                  aria-pressed={expanded}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "還原高度" : "放大譜面"}
                </button>
              )}
              <button
                className="score-button"
                aria-expanded={!collapsed}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? "顯示樂譜" : "收合樂譜"}
              </button>
            </div>
          </div>
          {!collapsed && (
            <ScoreNotation score={score} positionBeat={notationPosition} />
          )}
        </>
      ) : (
        <div
          className={`score-empty score-dropzone${dragging ? " score-dropzone-active" : ""}`}
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-disabled={busy}
          aria-label="拖曳樂譜到這裡，或點擊選擇檔案"
          onClick={chooseFile}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              chooseFile();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (busy) return;
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            upload(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="score-dropzone-icon" aria-hidden="true">↑</span>
          <strong>{dragging ? "放開以上傳樂譜" : "拖曳樂譜到這裡"}</strong>
          <p>或點擊此區選擇 PNG / 單頁 PDF · 最大 20 MB</p>
          <span className="score-button score-dropzone-button" aria-hidden="true">
            選擇檔案
          </span>
        </div>
      )}
    </section>
  );
}
