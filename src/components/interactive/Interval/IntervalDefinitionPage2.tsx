import { useState } from 'react';
import PianoKeyboard from '../PianoKeyboard';
import { calculateInterval } from './IntervalUtils';
import './IntervalDefinition.css';

const IntervalPage2 = () => {
  const [selection, setSelection] = useState<string[]>(['C4', 'D4']);

  const handleKeyClick = (note: string) => {
    setSelection(prev => [...prev.slice(1), note]);
  };
  
  const { lowNote, highNote, wholetones } = calculateInterval(selection[0], selection[1]);

  return (
    <div className="interval-container">
      <p className="page-content">兩個半音稱為一個「全音」，可以發現白鍵只有E、Ｆ和Ｂ、Ｃ之間沒有黑鍵，也就是說，只有這兩組白鍵音之間是半音，其餘相鄰白鍵音都是全音。</p>
      <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
        <PianoKeyboard startNote="C4" endNote="B4" onKeyClick={handleKeyClick} showWhiteKeyPitchNames={true} showBlackKeyPitchNames={true} showOctaveNumbers={true} />
        <div className="interval-result">
          <div className="result-note-box">{lowNote.replace('4', '')}</div>
        <div className="result-arrow">
          <span className="result-text">差 {wholetones} 個全音</span>
          <div className="arrow-line"></div>
        </div>
        <div className="result-note-box">{highNote.replace('4', '')}</div>
        </div>
      </div>
      <p className="instruction-text">點擊任意兩個琴鍵，計算相差幾個全音</p>
    </div>
  );
};
export default IntervalPage2;