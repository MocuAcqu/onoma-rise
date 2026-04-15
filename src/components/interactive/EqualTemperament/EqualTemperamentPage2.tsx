import { useState, useEffect, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { getETCalculation } from './ETUtils';
import './EqualTemperament.css';

const MIN_FREQ = 250;
const MAX_FREQ = 550;

const CANDIDATE_NOTES = [
  'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5'
];

const EqualTemperamentPage2 = () => {
  const [activeNote, setActiveNote] = useState('A4');
  const samplerRef = useRef<Tone.Sampler | null>(null);

  // 初始化音源
  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: { A4: "A4.mp3", C4: "C4.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    return () => { samplerRef.current?.dispose(); };
  }, []);

  // 計算符合範圍的音符及其位置
  const visibleNotes = useMemo(() => {
    return CANDIDATE_NOTES.map(note => {
      const freq = Tone.Frequency(note).toFrequency();
      const pos = ((freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * 100;
      return { note, freq, pos };
    }).filter(item => item.freq >= MIN_FREQ && item.freq <= MAX_FREQ);
  }, []);

  const handleNoteClick = async (note: string) => {
    await Tone.start();
    setActiveNote(note);
    samplerRef.current?.triggerAttackRelease(note, "4n");
  };

  const calc = getETCalculation(activeNote);

  return (
    <div className="et-container">
      <p className="page-desc">
        在線性頻率軸 (250Hz - 550Hz) 上，你可以觀察到音符之間的物理距離並不相等。
      </p>

      <div className="formula-card">
        <div className="note-badge">{activeNote}</div>
        <span className="formula-main">{calc.formula}</span>
        <span className="formula-main">=</span>
        <span className="formula-result">{calc.frequency} Hz</span>
      </div>

      <div className="frequency-axis-container">
        <div className="axis-header">
          <span>{MIN_FREQ} Hz</span>
          <span className="axis-title">線性頻率分佈 (Hz)</span>
          <span>{MAX_FREQ} Hz</span>
        </div>
        
        <div className="scale-line-container">
          <div className="main-axis-line"></div>
          
          {visibleNotes.map((item) => (
            <div 
              key={item.note}
              className={`scale-dot-wrapper ${activeNote === item.note ? 'active' : ''}`}
              style={{ left: `${item.pos}%` }}
              onClick={() => handleNoteClick(item.note)}
            >
              <div className="scale-dot"></div>
              <div className="note-name-label">{item.note}</div>
              <div className="freq-tick-label">{item.freq.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="instruction-text">點擊圓點聆聽聲音，觀察音符在頻率軸上的疏密關係</p>
    </div>
  );
};
export default EqualTemperamentPage2;