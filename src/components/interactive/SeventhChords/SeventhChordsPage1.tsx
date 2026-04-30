import { useState, useMemo } from 'react';
import ChordStaff from '../ChordStaff';
import { calculateInterval } from '../Interval/IntervalUtils';
import { generateScale } from '../ScaleTypes/ScaleUtils';
import { SCALE_FORMULAS } from '../ScaleTypes/ScaleUtils';
import '../Triads/Triads.css'; 

const MAJOR_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const SeventhChordsPage1 = () => {
  const [selectedKey, setSelectedKey] = useState('C');

  const chordNotes = useMemo(() => {
    const scale = generateScale(selectedKey, SCALE_FORMULAS.major);
    if (scale.length < 8) return ['C4', 'E4', 'G4', 'B4']; 
    
    return [scale[0].fullPitch, scale[2].fullPitch, scale[4].fullPitch, scale[6].fullPitch];
  }, [selectedKey]);

  // 計算度數
  const intervalToThird = calculateInterval(chordNotes[0], chordNotes[1]);
  const intervalToFifth = calculateInterval(chordNotes[0], chordNotes[2]);
  const intervalToSeventh = calculateInterval(chordNotes[0], chordNotes[3]);

  return (
    <div className="chord-container">
      <p className="page-content" style={{marginTop:'5%'}}>七和弦是指在原本的三和弦再加上第七度的音，共有四個音。</p>
      
      <select className="key-selector" value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
        {MAJOR_KEYS.map(key => (
          <option key={key} value={key}>{key} 大調</option>
        ))}
      </select>

      <div className="staff-chord-layout">
        <ChordStaff notes={chordNotes} />
        
        <div className="interval-derivation">
          <div className="interval-result">
            <div className="result-note-box">{chordNotes[0].replace(/[0-9]/g,'')}</div>
            <div className="result-arrow">
              <span className="result-text">差 {intervalToThird.degree} 度</span>
              <div className="arrow-line"></div>
            </div>
            <div className="result-note-box">{chordNotes[1].replace(/[0-9]/g,'')}</div>
          </div>
          <div className="interval-result">
            <div className="result-note-box">{chordNotes[0].replace(/[0-9]/g,'')}</div>
            <div className="result-arrow">
              <span className="result-text">差 {intervalToFifth.degree} 度</span>
              <div className="arrow-line"></div>
            </div>
            <div className="result-note-box">{chordNotes[2].replace(/[0-9]/g,'')}</div>
          </div>
          <div className="interval-result">
            <div className="result-note-box">{chordNotes[0].replace(/[0-9]/g,'')}</div>
            <div className="result-arrow">
              <span className="result-text">差 {intervalToSeventh.degree} 度</span>
              <div className="arrow-line"></div>
            </div>
            <div className="result-note-box">{chordNotes[3].replace(/[0-9]/g,'')}</div>
          </div>
        </div>
      </div>
      <p className="instruction-text">點擊下選單查看不同和弦範例，點擊五線譜聆聽和弦聲音</p>
    </div>
  );
};

export default SeventhChordsPage1;