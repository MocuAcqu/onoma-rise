import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { FiPlay, FiX } from 'react-icons/fi';
import { getGuideLesson } from './guideContent';
import './GuideAssistant.css';

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
  const lesson = getGuideLesson(chapterId);
  const demo = demos[chapterId ?? '']?.find(item => item.page === pageIndex);
  const hint = lesson.hints[(pageIndex + hintStep) % lesson.hints.length] ?? `第 ${pageIndex + 1} 頁`; 

  useEffect(() => { if (!container.current) return; const animation = lottie.loadAnimation({ container: container.current, renderer: 'svg', loop: true, autoplay: true, path: animationPaths[Math.floor(Math.random() * animationPaths.length)] }); return () => animation.destroy(); }, []);
  const playDemo = () => { if (!demo) return; window.dispatchEvent(new CustomEvent('onoma-play-tool-demo', { detail: demo })); setIsOpen(false); };

  return <aside className="guide-assistant" aria-label="Onoma 學習小導師">
    <button className="guide-bubble" onClick={() => setHintStep(step => step + 1)}>{hint}</button>
    <button className={`guide-avatar ${demo ? 'guide-avatar--available' : ''}`} onClick={() => demo && setIsOpen(true)} aria-label={demo ? '開啟 Onoma 的工具示範' : '此頁沒有額外範例'}><span>{demo ? '點我' : `${pageIndex + 1}/${totalPages}`}</span><div className="guide-lottie" ref={container} /></button>
    {isOpen && demo && <div className="guide-overlay" role="dialog" aria-modal="true"><section className="guide-panel"><button className="guide-close" onClick={() => setIsOpen(false)} aria-label="關閉"><FiX /></button><span className="guide-kicker">ONOMA 的示範</span><h2>{demo.label}</h2><p>觀察琴鍵、音符或音名是如何被播放的!</p><button className="guide-example-button" onClick={playDemo}><FiPlay /> 開始示範</button></section></div>}
  </aside>;
}
