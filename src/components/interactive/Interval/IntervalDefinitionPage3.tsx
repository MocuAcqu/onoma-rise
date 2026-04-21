import  { useState } from 'react';
import InteractiveStaff from '../InteractiveStaff';
import { calculateInterval } from './IntervalUtils';
import './IntervalDefinition.css';

// 定義 C 大調音階的音符，用於顯示在五線譜上
const cMajorScaleNotes = [
  { pitch: 'C4', position: 1, pitchName: 'C', solfege: 'Do', hasLedgerLine: true },
  { pitch: 'D4', position: 1.5, pitchName: 'D', solfege: 'Re' },
  { pitch: 'E4', position: 2, pitchName: 'E', solfege: 'Mi' },
  { pitch: 'F4', position: 2.5, pitchName: 'F', solfege: 'Fa' },
  { pitch: 'G4', position: 3, pitchName: 'G', solfege: 'Sol' },
  { pitch: 'A4', position: 3.5, pitchName: 'A', solfege: 'La' },
  { pitch: 'B4', position: 4, pitchName: 'B', solfege: 'Si' },
  { pitch: 'C5', position: 4.5, pitchName: 'C', solfege: 'Do' },
];

const IntervalPage3 = () => {
  const [selection, setSelection] = useState<string[]>(['C4', 'D4']);

  const handleNoteClick = (note: { pitch: string }) => {
    setSelection(prev => [...prev.slice(1), note.pitch]);
  };

  const { lowNote, highNote, degree } = calculateInterval(selection[0], selection[1]);

  const lowSolfege = cMajorScaleNotes.find(n => n.pitch === lowNote)?.solfege || lowNote;
  const highSolfege = cMajorScaleNotes.find(n => n.pitch === highNote)?.solfege || highNote;

  return (
    <div className="interval-container">
      <p className="page-content">「度」是另一種音程的距離單位，從一個音的名字唸到另一個音的名字，總共經過幾個字，其距離就是幾度，這也是為什麼一組 12 個半音的會稱為一個八度。</p>
      
      <InteractiveStaff 
        notes={cMajorScaleNotes} 
        onKeyClick={handleNoteClick} 
      />

      <div className="interval-result">
        <div className="result-note-box">{lowSolfege}</div>
        <div className="result-arrow">
          <span className="result-text">差 {degree} 度</span>
          <div className="arrow-line"></div>
        </div>
        <div className="result-note-box">{highSolfege}</div>
      </div>

      <p className="instruction-text">以 C 大調為範例，點擊任意兩個音符，計算相差幾度</p>
    </div>
  );
};

export default IntervalPage3;