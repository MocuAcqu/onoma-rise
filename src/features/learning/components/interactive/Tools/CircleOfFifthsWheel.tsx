import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import './Tools.css';

type KeySlice = {
  major: string;
  majorPlay: string;
  minor: string;
  minorPlay: string;
  signature: string;
};

const KEYS: KeySlice[] = [
  { major: 'C', majorPlay: 'C', minor: 'Am', minorPlay: 'A', signature: '0' },
  { major: 'G', majorPlay: 'G', minor: 'Em', minorPlay: 'E', signature: '1♯' },
  { major: 'D', majorPlay: 'D', minor: 'Bm', minorPlay: 'B', signature: '2♯' },
  { major: 'A', majorPlay: 'A', minor: 'F#m', minorPlay: 'F#', signature: '3♯' },
  { major: 'E', majorPlay: 'E', minor: 'C#m', minorPlay: 'C#', signature: '4♯' },
  { major: 'B', majorPlay: 'B', minor: 'G#m', minorPlay: 'G#', signature: '5♯' },
  { major: 'F#/Gb', majorPlay: 'F#', minor: 'D#m/\nEbm', minorPlay: 'D#', signature: '6♯ / 6♭' },
  { major: 'Db', majorPlay: 'Db', minor: 'Bbm', minorPlay: 'Bb', signature: '5♭' },
  { major: 'Ab', majorPlay: 'Ab', minor: 'Fm', minorPlay: 'F', signature: '4♭' },
  { major: 'Eb', majorPlay: 'Eb', minor: 'Cm', minorPlay: 'C', signature: '3♭' },
  { major: 'Bb', majorPlay: 'Bb', minor: 'Gm', minorPlay: 'G', signature: '2♭' },
  { major: 'F', majorPlay: 'F', minor: 'Dm', minorPlay: 'D', signature: '1♭' },
];

const pointAt = (radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) };
};

const donutSlice = (inner: number, outer: number, start: number, end: number) => {
  const a = pointAt(outer, start); const b = pointAt(outer, end);
  const c = pointAt(inner, end); const d = pointAt(inner, start);
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z`;
};

export default function CircleOfFifthsWheel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeType, setActiveType] = useState<'major' | 'minor'>('major');
  const [isAudioReady, setIsAudioReady] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: { A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3' },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
    }).toDestination();
    Tone.loaded().then(() => setIsAudioReady(true));
    return () => { samplerRef.current?.dispose(); };
  }, []);

  const selectKey = async (index: number, type: 'major' | 'minor') => {
    setActiveIndex(index); setActiveType(type);
    await Tone.start();
    if (!isAudioReady) return;
    const root = KEYS[index][type === 'major' ? 'majorPlay' : 'minorPlay'];
    // Match the previous circle interaction: one piano note per click.
    samplerRef.current?.triggerAttackRelease(`${root}4`, '4n');
  };

  const active = KEYS[activeIndex];
  const selectedName = activeType === 'major' ? active.major : active.minor;
  const selectedLabel = activeType === 'major' ? '大調' : '小調';
  const selectedNameLines = selectedName.split('/');
  const hasSplitSelectedName = selectedNameLines.length > 1;

  return <section className="fifths-wheel">
    <div className="fifths-wheel__frame">
      <svg className="fifths-wheel__svg" viewBox="0 0 100 100" role="group" aria-label="可互動的五度圈">
        <defs>
          <linearGradient id="fifths-default-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dbeaf1" />
          </linearGradient>
          <linearGradient id="fifths-active-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4bace" />
            <stop offset="100%" stopColor="#8ed0e9" />
          </linearGradient>
        </defs>
        {KEYS.map((key, index) => {
          const start = -105 + index * 30 + 0.8; const end = -105 + (index + 1) * 30 - 0.8;
          const middle = (start + end) / 2;
          const signaturePoint = pointAt(44, middle);
          const majorPoint = pointAt(31, middle);
          const minorPoint = pointAt(19, middle);
          return <g key={key.major}>
            <path d={donutSlice(39, 49, start, end)} className="fifths-wheel__signature-slice" />
            <text x={signaturePoint.x} y={signaturePoint.y} className="fifths-wheel__signature-text">{key.signature}</text>
            <path d={donutSlice(23, 38.5, start, end)} className={`fifths-wheel__major-slice ${activeIndex === index && activeType === 'major' ? 'is-active' : ''}`} onClick={() => selectKey(index, 'major')} tabIndex={0} role="button" aria-label={`播放 ${key.major} 大調和弦`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectKey(index, 'major'); }} />
            <text x={majorPoint.x} y={majorPoint.y} className={`fifths-wheel__major-text ${key.major.length > 2 ? 'is-long' : ''}`} pointerEvents="none">{key.major}</text>
            <path d={donutSlice(11, 22.5, start, end)} className={`fifths-wheel__minor-slice ${activeIndex === index && activeType === 'minor' ? 'is-active' : ''}`} onClick={() => selectKey(index, 'minor')} tabIndex={0} role="button" aria-label={`播放 ${key.minor} 小調和弦`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectKey(index, 'minor'); }} />
            <text x={minorPoint.x} y={minorPoint.y} className={`fifths-wheel__minor-text ${key.minor.includes('/') ? 'is-split' : key.minor.length > 3 ? 'is-long' : ''}`} pointerEvents="none">
              {key.minor.includes('/') ? key.minor.split('/').map((part, labelIndex) => <tspan key={part} x={minorPoint.x} y={minorPoint.y + (labelIndex === 0 ? -1.25 : 1.25)}>{part}</tspan>) : key.minor}
            </text>
          </g>;
        })}
        <circle cx="50" cy="50" r="10.5" className="fifths-wheel__centre" />
        <text x="50" y="45.2" className="fifths-wheel__centre-label">目前選擇</text>
        <text x="50" y="52.2" className={`fifths-wheel__centre-key ${hasSplitSelectedName ? 'is-split' : ''}`}>
          {hasSplitSelectedName ? <><tspan x="50" y="50.5">{selectedNameLines[0]}</tspan><tspan x="50" y="54.3">{selectedNameLines[1]}</tspan></> : selectedName}
        </text>
        <text x="50" y={hasSplitSelectedName ? '58.2' : '56.5'} className="fifths-wheel__centre-label">{selectedLabel} · {active.signature}</text>
      </svg>
    </div>
    <div className="fifths-wheel__legend">
      <span><i className="fifths-wheel__sample fifths-wheel__sample--signature" />外圈：調號數</span>
      <span><i className="fifths-wheel__sample fifths-wheel__sample--major" />中圈：大調</span>
      <span><i className="fifths-wheel__sample fifths-wheel__sample--minor" />內圈：關係小調</span>
    </div>
    <p className={`fifths-wheel__audio ${isAudioReady ? 'is-ready' : ''}`}>{isAudioReady ? '點選大調或小調扇區即可播放對應音高' : '正在載入音色…'}</p>
  </section>;
}
