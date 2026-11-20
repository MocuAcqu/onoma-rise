import { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import { FiPlay, FiX } from 'react-icons/fi';
import { getGuideLesson } from './guideContent';
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery';
import './GuideAssistant.css';

/** 平板與手機：對話框只短暫出現，避免一直蓋住互動內容 */
const COMPACT_QUERY = '(max-width: 1023px)';
const BUBBLE_AUTO_HIDE_MS = 5000;

type Props = { chapterId?: string; pageIndex: number; totalPages: number };
type ToolDemo = { page: number; target: 'piano' | 'staff' | 'solfege-voice' | 'pitch-class' | 'interval' | 'scale' | 'seventh' | 'tonnetz'; sequence: string[]; label: string };
const twinkle = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'];
const demos: Record<string, ToolDemo[]> = {
  'pitch-name': [{ page: 0, target: 'piano', sequence: twinkle, label: '用本頁琴鍵播放《小星星》' }, { page: 2, target: 'staff', sequence: twinkle, label: '用本頁音符播放《小星星》' }],
  solfege: [{ page: 0, target: 'solfege-voice', sequence: ['Do', 'Do', 'Sol', 'Sol', 'La', 'La', 'Sol'], label: '用本頁唱名按鈕播放《小星星》' }, { page: 1, target: 'staff', sequence: twinkle, label: '用本頁音符播放《小星星》' }],
  'pitch-class-set': [{ page: 0, target: 'pitch-class', sequence: twinkle, label: '用本頁音名階梯播放《小星星》' }],
  'interval-definition': [{ page: 0, target: 'interval', sequence: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'], label: '用本頁半音琴鍵示範 1155665／4433221' }],
  'scale-types': [{ page: 1, target: 'scale', sequence: ['C4', 'C4', 'G4', 'G4', 'Ab4', 'Ab4', 'G4'], label: '用自然小音階工具播放黑暗小星星' }],
};
const animationPaths = ['/assets/guide/bluewave.json', '/assets/guide/greenb.json', '/assets/guide/lightgrb.json', '/assets/guide/lightgreenwave.json', '/assets/guide/pinkb.json', '/assets/guide/pinkwave.json', '/assets/guide/purpleb.json', '/assets/guide/purplewave.json', '/assets/guide/yellowb.json', '/assets/guide/yellowwave.json'];

export default function GuideAssistant({ chapterId, pageIndex, totalPages }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [hintStep, setHintStep] = useState(0); const [isOpen, setIsOpen] = useState(false);
  const [animationPath] = useState(() => animationPaths[Math.floor(Math.random() * animationPaths.length)]);
  // 「跳躍」系列（*b.json）的角色在畫布中較小，需要另外放大
  const isJumpAnimation = /b\.json$/.test(animationPath);
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  // 每次顯示對話框都重新計時；元件以「章節＋頁碼」為 key，換頁時會重新出現一次
  const [bubbleShownAt, setBubbleShownAt] = useState(0);
  const lesson = getGuideLesson(chapterId);
  const demo = demos[chapterId ?? '']?.find(item => item.page === pageIndex);
  const hint = lesson.hints[(pageIndex + hintStep) % lesson.hints.length] ?? `第 ${pageIndex + 1} 頁`; 

  useEffect(() => {
    if (!container.current) return;
    let cancelled = false;
    let animation: AnimationItem | undefined;

    void import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animationPath,
        // 動畫畫布是 1920×1080，角色只在正中央；以 slice 裁掉左右空白，角色才不會縮得太小
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      });
    });

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [animationPath]);

  useEffect(() => {
    if (!isCompact || !isBubbleVisible) return;
    const timer = window.setTimeout(() => setIsBubbleVisible(false), BUBBLE_AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [isCompact, isBubbleVisible, bubbleShownAt]);

  const showBubble = () => { setIsBubbleVisible(true); setBubbleShownAt(Date.now()); };
  const nextHint = () => { setHintStep(step => step + 1); showBubble(); };
  const handleAvatarClick = () => {
    if (demo) { setIsOpen(true); return; }
    // 沒有示範的頁面：收起時先叫出對話框，展開時換下一則提示
    if (isCompact && !isBubbleVisible) showBubble();
    else nextHint();
  };
  const bubbleHidden = isCompact && !isBubbleVisible;
  const playDemo = () => { if (!demo) return; window.dispatchEvent(new CustomEvent('onoma-play-tool-demo', { detail: demo })); setIsOpen(false); };

  return <aside className="guide-assistant" aria-label="Onoma 學習小導師">
    <button className={`guide-bubble ${bubbleHidden ? 'is-hidden' : ''}`} onClick={nextHint} aria-hidden={bubbleHidden} tabIndex={bubbleHidden ? -1 : 0}>{hint}</button>
    <button className={`guide-avatar ${demo ? 'guide-avatar--available' : ''}`} onClick={handleAvatarClick} aria-label={demo ? '開啟 Onoma 的工具示範' : '顯示 Onoma 的提示'}><span>{demo ? '點我' : `${pageIndex + 1}/${totalPages}`}</span><div className={`guide-lottie ${isJumpAnimation ? 'guide-lottie--jump' : ''}`}><div className="guide-lottie-canvas" ref={container} /></div></button>
    {isOpen && demo && <div className="guide-overlay" role="dialog" aria-modal="true"><section className="guide-panel"><button className="guide-close" onClick={() => setIsOpen(false)} aria-label="關閉"><FiX /></button><span className="guide-kicker">ONOMA 的示範</span><h2>{demo.label}</h2><p>觀察琴鍵、音符或音名是如何被播放的!</p><button className="guide-example-button" onClick={playDemo}><FiPlay /> 開始示範</button></section></div>}
  </aside>;
}
