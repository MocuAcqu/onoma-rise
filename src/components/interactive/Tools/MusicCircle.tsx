import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import './Tools.css';

type CircleKind = 'fifths' | 'chromatic';

const CIRCLES = {
  fifths: {
    title: '五度圈',
    notes: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'],
    step: '相鄰音相差完全五度',
  },
  chromatic: {
    title: '半音圈',
    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    step: '相鄰音相差一個半音',
  },
} as const;

type MusicCircleProps = { kind: CircleKind; compact?: boolean };

export default function MusicCircle({ kind, compact = false }: MusicCircleProps) {
  const circle = CIRCLES[kind];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      // Same piano samples used by the project's existing interactive lessons.
      urls: { A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3' },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
    }).toDestination();

    Tone.loaded().then(() => setIsAudioReady(true));
    return () => { samplerRef.current?.dispose(); };
  }, []);

  const positions = useMemo(() => circle.notes.map((note, index) => {
    const angle = (index / circle.notes.length) * Math.PI * 2 - Math.PI / 2;
    return { note, x: 50 + Math.cos(angle) * 38, y: 50 + Math.sin(angle) * 38 };
  }), [circle.notes]);

  const playIndex = async (index: number) => {
    setActiveIndex(index);
    await Tone.start();
    if (isAudioReady) samplerRef.current?.triggerAttackRelease(`${circle.notes[index]}4`, '4n');
  };

  const previousIndex = (activeIndex - 1 + circle.notes.length) % circle.notes.length;
  const previousNote = circle.notes[previousIndex];
  const activeNote = circle.notes[activeIndex];

  return (
    <section className={`music-circle music-circle--${kind} ${compact ? 'music-circle--compact' : ''}`}>
      <div className="music-circle__canvas" aria-label={`${circle.title}互動圖`}>
        <svg className="music-circle__lines" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="38" className="music-circle__guide" />
          {positions.map((position, index) => {
            const next = positions[(index + 1) % positions.length];
            return <line key={`${position.note}-${next.note}`} x1={position.x} y1={position.y} x2={next.x} y2={next.y} className={index === previousIndex ? 'music-circle__edge music-circle__edge--active' : 'music-circle__edge'} />;
          })}
        </svg>

        <div className="music-circle__centre" aria-live="polite">
          <span className="music-circle__eyebrow">目前音高</span>
          <strong>{activeNote}</strong>
          <span>{previousNote} → {activeNote}</span>
        </div>

        {positions.map(({ note, x, y }, index) => (
          <button type="button" key={note} className={`music-circle__note ${index === activeIndex ? 'is-active' : ''} ${index === previousIndex ? 'is-previous' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => playIndex(index)} aria-label={`播放 ${note}`} aria-pressed={index === activeIndex}>
            {note}
          </button>
        ))}
      </div>

      <div className="music-circle__status">
        <span className="music-circle__badge">{circle.step}</span>
        <span className={`music-circle__audio-state ${isAudioReady ? 'is-ready' : ''}`}>{isAudioReady ? '音色已就緒' : '正在載入音色…'}</span>
        {!compact && <div className="music-circle__controls" aria-label="移動音高">
          <button type="button" onClick={() => playIndex(previousIndex)}>← 前一音</button>
          <button type="button" onClick={() => playIndex((activeIndex + 1) % circle.notes.length)}>下一音 →</button>
          <button type="button" onClick={() => playIndex(0)}>回到 C</button>
        </div>}
        {!compact && <div className="music-circle__legend"><span><i className="music-circle__legend-line is-active" />亮線：剛選擇的相鄰關係</span><span><i className="music-circle__legend-dot" />藍粉色：目前音</span></div>}
      </div>
    </section>
  );
}
