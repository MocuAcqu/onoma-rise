import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import './PianoKeyboard.css';

// 定義所有音符，包含八度
const ALL_NOTES = [
  'A0', 'A#0', 'B0',
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
  'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
  'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6',
  'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7', 'A#7', 'B7',
  'C8'
];

type PianoKeyboardProps = {
  startNote: string;
  endNote: string;
  showWhiteKeyPitchNames?: boolean;
  showBlackKeyPitchNames?: boolean;
  showOctaveNumbers?: boolean;
  onKeyClick?: (note: string, type: 'white' | 'black') => void;
  highlightNotes?: string[];
};

const pianoSampler = new Tone.Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3"
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/" 
}).toDestination();

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startNote,
  endNote,
  showWhiteKeyPitchNames = false,
  showBlackKeyPitchNames = false,
  showOctaveNumbers = false,
  onKeyClick,
  highlightNotes = [],
}) => {

  // 根據傳入的起點和終點音符，產生琴鍵
  const keys = useMemo(() => {
    const startIndex = ALL_NOTES.indexOf(startNote);
    const endIndex = ALL_NOTES.indexOf(endNote);
    if (startIndex === -1 || endIndex === -1) return [];

    return ALL_NOTES.slice(startIndex, endIndex + 1).map(note => ({
      note,
      midi: Tone.Frequency(note).toMidi(),
      type: note.includes('#') ? 'black' : 'white',
      pitch: note.replace(/[0-8]/, ''), 
      octave: note.slice(-1),
    }));
  }, [startNote, endNote]);

  // 白鍵最大寬度 50px，黑鍵寬度為白鍵的 60%。
  // 以百分比定位，讓鍵盤在窄螢幕上等比例縮小；但白鍵不小於 40px（黑鍵 24px），
  // 再窄就改為左右滑動，避免琴鍵小到點不準。
  const whiteKeyWidth = 50;
  const minWhiteKeyWidth = 40;
  const containerPadding = 10;
  const whiteKeyTotal = keys.filter((key) => key.type === 'white').length;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ overflow: false, atStart: true, atEnd: true });

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 只差幾 px 時不算需要滑動（避免為了極小差距顯示滑動提示）
    const overflow = el.scrollWidth > el.clientWidth + 6;
    const next = {
      overflow,
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    };
    setScrollState(prev => (
      prev.overflow === next.overflow && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next
    ));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState, whiteKeyTotal]);

  const getBlackKeyStyle = (index: number): React.CSSProperties => {
    // 計算這個黑鍵前面有多少個白鍵
    let whiteKeyCount = 0;
    for (let i = 0; i < index; i++) {
      if (!keys[i].note.includes('#')) {
        whiteKeyCount++;
      }
    }

    const whitePercent = 100 / Math.max(whiteKeyTotal, 1);
    return {
      left: `${whiteKeyCount * whitePercent - whitePercent * 0.3}%`,
      width: `${whitePercent * 0.6}%`,
    };
  };

  const playNote = useCallback((note: string, velocity: number, type: 'white' | 'black') => {
    Tone.start(); 
    pianoSampler.triggerAttackRelease(note, "2n", Tone.now(), velocity);
    
    if (onKeyClick) { onKeyClick(note, type);}
  }, [onKeyClick]);

  const highlightMidis = useMemo(() => {
    return highlightNotes.map(n => Tone.Frequency(n).toMidi());
  }, [highlightNotes]);
  const [demoNote, setDemoNote] = useState<string | null>(null);

  useEffect(() => {
    const handleDemo = (event: Event) => {
      const demo = (event as CustomEvent<{ target: string; sequence: string[] }>).detail;
      if (demo.target !== 'piano') return;
      demo.sequence.forEach((note, index) => {
        window.setTimeout(() => { setDemoNote(note); playNote(note, 0.9, note.includes('#') ? 'black' : 'white'); }, index * 620);
      });
      window.setTimeout(() => setDemoNote(null), demo.sequence.length * 620);
    };
    window.addEventListener('onoma-play-tool-demo', handleDemo);
    return () => window.removeEventListener('onoma-play-tool-demo', handleDemo);
  }, [playNote]);

  // 鍵盤需要左右滑動時，自動把示範中或標示中的琴鍵捲到可視範圍
  const focusNote = demoNote ?? highlightNotes[0] ?? null;
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !focusNote || scroller.scrollWidth <= scroller.clientWidth + 1) return;
    const focusMidi = Tone.Frequency(focusNote).toMidi();
    const target = Array.from(scroller.querySelectorAll<HTMLElement>('.piano-key'))
      .find(el => Number(el.dataset.midi) === focusMidi);
    if (!target) return;
    const sRect = scroller.getBoundingClientRect();
    const kRect = target.getBoundingClientRect();
    // 和弦等多個標示音時，以第一個音為起點、靠左留一點空間；示範單音時置中
    const offset = demoNote ? (sRect.width - kRect.width) / 2 : Math.min(48, sRect.width / 4);
    scroller.scrollTo({ left: scroller.scrollLeft + kRect.left - sRect.left - offset, behavior: 'smooth' });
  }, [focusNote, demoNote]);

  // 左右漸層提示：還有琴鍵藏在哪一側
  const wrapClasses = [
    'piano-scroll-wrap',
    scrollState.overflow ? 'is-scrollable' : '',
    scrollState.overflow && !scrollState.atStart ? 'fade-start' : '',
    scrollState.overflow && !scrollState.atEnd ? 'fade-end' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClasses}>
    <div className="piano-scroll" ref={scrollerRef} onScroll={updateScrollState}>
    <div
      className="piano-container"
      style={{
        width: whiteKeyTotal * whiteKeyWidth + containerPadding * 2,
        minWidth: whiteKeyTotal * minWhiteKeyWidth + containerPadding * 2,
      }}
    >
      <div className="piano-keys">
      {keys.map(({ note, midi, type, pitch, octave }, index) => {
        const isHighlighted = highlightMidis.includes(midi) || demoNote === note;
      
        return(
          <button
            key={note}
            className={`piano-key ${type}-key ${isHighlighted ? 'highlighted' : ''}`}
            style={type === 'black' ? getBlackKeyStyle(index) : {}}
            data-midi={midi}
            onPointerDown={() => playNote(note, 0.8, type as 'white' | 'black')}
          >
            {type === 'white' && showWhiteKeyPitchNames && (
              <span className="key-label white-label">{pitch.replace('#', '')}{showOctaveNumbers && <span className="octave-number">{octave}</span>}</span>
            )}
            {type === 'black' && showBlackKeyPitchNames && (
              <span className="key-label black-label">{pitch}{showOctaveNumbers && <span className="octave-number">{octave}</span>}</span>
            )}
          </button>
      )})}
      </div>
    </div>
    </div>
    {scrollState.overflow && <p className="piano-scroll-hint" aria-hidden="true">← 左右滑動看更多琴鍵 →</p>}
    </div>
  );
};

export default PianoKeyboard;
