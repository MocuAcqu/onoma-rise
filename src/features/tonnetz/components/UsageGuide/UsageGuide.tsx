import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import "./UsageGuide.css";

export type GuideTopic = "audio" | "score";

const imageRange = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) =>
    `/assets/tonnetz-guide/${prefix}-${String(i + 1).padStart(2, "0")}.png`);

const GUIDES: Record<GuideTopic, { label: string; intro: string; images: string[] }> = {
  audio: {
    label: "音訊辨識",
    intro: "跟著說明一步步了解如何匯入音檔、播放旋律，並在調性網路上觀察音符與和弦。",
    images: imageRange("audio", 11),
  },
  score: {
    label: "樂譜辨識",
    intro: "跟著說明了解如何匯入 PNG／PDF 樂譜、等待辨識，並同步播放樂譜與調性網路。",
    images: imageRange("score", 4),
  },
};
const TOPICS: GuideTopic[] = ["audio", "score"];
const MASCOT_ANIMATION = "/assets/guide/yellowb.json";

type Stage = "prompt" | "viewer";

type Props = {
  /** 目前的工作模式；第一次進入某模式時，會自動詢問是否查看該模式的說明 */
  mode: GuideTopic;
};

export default function UsageGuide({ mode }: Props) {
  // 進入頁面時立即詢問目前模式的說明
  const [isOpen, setIsOpen] = useState(true);
  const [stage, setStage] = useState<Stage>("prompt");
  const [topic, setTopic] = useState<GuideTopic>(mode);
  const [page, setPage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [promptedModes, setPromptedModes] = useState<ReadonlySet<GuideTopic>>(() => new Set([mode]));
  const dialogRef = useRef<HTMLDivElement>(null);

  /* 每次造訪頁面，第一次切換到某個模式時跳出詢問框 */
  if (!promptedModes.has(mode)) {
    setPromptedModes(new Set([...promptedModes, mode]));
    setTopic(mode);
    setPage(0);
    setIsZoomed(false);
    setStage("prompt");
    setIsOpen(true);
  }

  const guide = GUIDES[topic];
  const lastPage = guide.images.length - 1;

  const close = useCallback(() => {
    setIsOpen(false);
    setIsZoomed(false);
  }, []);

  const goTo = useCallback((next: number) => {
    setPage(Math.min(Math.max(next, 0), lastPage));
  }, [lastPage]);

  const switchTopic = (next: GuideTopic) => {
    setTopic(next);
    setPage(0);
    setIsZoomed(false);
  };

  const openFromMascot = () => {
    setTopic(mode);
    setPage(0);
    setIsZoomed(false);
    setStage("viewer");
    setIsOpen(true);
  };

  /* 鍵盤：Esc 先縮回放大圖片再關閉；左右鍵翻頁 */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isZoomed) setIsZoomed(false);
        else close();
      } else if (stage === "viewer" && event.key === "ArrowLeft") {
        goTo(page - 1);
      } else if (stage === "viewer" && event.key === "ArrowRight") {
        goTo(page + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isZoomed, stage, page, goTo, close]);

  /* 開啟時鎖定背景捲動並把焦點移到對話框 */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  /* 預先載入目前分頁的說明圖片，翻頁時不會閃白 */
  useEffect(() => {
    if (!isOpen || stage !== "viewer") return;
    guide.images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [isOpen, stage, guide]);

  return (
    <>
      <GuideMascot onClick={openFromMascot} />

      {isOpen && (
        <div className="usage-guide-overlay">
          <div
            ref={dialogRef}
            className={`usage-guide-dialog usage-guide-dialog--${stage}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="usage-guide-title"
            tabIndex={-1}
          >
            <header className="usage-guide-header">
              <h2 id="usage-guide-title">使用說明</h2>
              <div className="usage-guide-tabs" role="tablist" aria-label="說明主題">
                {TOPICS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={topic === key}
                    className={`usage-guide-tab ${topic === key ? "is-active" : ""}`}
                    onClick={() => switchTopic(key)}
                  >
                    {GUIDES[key].label}
                  </button>
                ))}
              </div>
              <button type="button" className="usage-guide-close" onClick={close} aria-label="關閉使用說明">
                <FiX />
              </button>
            </header>

            {stage === "prompt" ? (
              <div className="usage-guide-prompt">
                <p className="usage-guide-kicker">{guide.label}・共 {guide.images.length} 頁</p>
                <p className="usage-guide-question">要查看「{guide.label}」的使用說明嗎？</p>
                <p className="usage-guide-intro">{guide.intro}</p>
                <p className="usage-guide-hint">之後也可以點右上角的吉祥物，隨時再打開說明。</p>
                <div className="usage-guide-actions">
                  <button type="button" className="usage-guide-btn usage-guide-btn--ghost" onClick={close}>
                    跳過
                  </button>
                  <button
                    type="button"
                    className="usage-guide-btn usage-guide-btn--primary"
                    onClick={() => { setPage(0); setStage("viewer"); }}
                  >
                    查看使用說明
                  </button>
                </div>
              </div>
            ) : (
              <div className="usage-guide-viewer">
                <button
                  type="button"
                  className="usage-guide-figure"
                  onClick={() => setIsZoomed(true)}
                  aria-label="點擊放大圖片"
                  title="點擊放大"
                >
                  <img
                    src={guide.images[page]}
                    alt={`${guide.label}使用說明 第 ${page + 1} 頁`}
                    draggable={false}
                  />
                </button>

                <div className="usage-guide-nav">
                  <button
                    type="button"
                    className="usage-guide-btn usage-guide-btn--ghost"
                    onClick={() => goTo(page - 1)}
                    disabled={page === 0}
                  >
                    <FiChevronLeft /> 上一頁
                  </button>

                  <div className="usage-guide-dots" aria-label={`第 ${page + 1} 頁，共 ${guide.images.length} 頁`}>
                    {guide.images.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        className={`usage-guide-dot ${index === page ? "is-active" : ""}`}
                        onClick={() => goTo(index)}
                        aria-label={`前往第 ${index + 1} 頁`}
                      />
                    ))}
                    <span className="usage-guide-count">{page + 1} / {guide.images.length}</span>
                  </div>

                  {page < lastPage ? (
                    <button
                      type="button"
                      className="usage-guide-btn usage-guide-btn--primary"
                      onClick={() => goTo(page + 1)}
                    >
                      下一頁 <FiChevronRight />
                    </button>
                  ) : (
                    <button type="button" className="usage-guide-btn usage-guide-btn--primary" onClick={close}>
                      完成
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {isZoomed && stage === "viewer" && (
            <button
              type="button"
              className="usage-guide-zoom"
              onClick={() => setIsZoomed(false)}
              aria-label="點擊縮回圖片"
            >
              <img src={guide.images[page]} alt={`${guide.label}使用說明 第 ${page + 1} 頁（放大）`} draggable={false} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

/* 右上角的黃色吉祥物按鈕（沿用學習頁小導師的 Lottie 動畫） */
function GuideMascot({ onClick }: { onClick: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let animation: AnimationItem | undefined;
    void import("lottie-web").then(({ default: lottie }) => {
      if (cancelled || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: MASCOT_ANIMATION,
      });
    });
    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <button type="button" className="usage-guide-mascot" onClick={onClick} aria-label="開啟使用說明">
      <span className="usage-guide-mascot-label">使用說明</span>
      <div className="usage-guide-mascot-lottie" ref={container} />
    </button>
  );
}
