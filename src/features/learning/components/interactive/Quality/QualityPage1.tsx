import { useState } from 'react';
import PianoKeyboard from '../PianoKeyboard';
import { calculateInterval } from '../Interval/IntervalUtils';
import '../Interval/IntervalDefinition.css';

const QualityPage1 = () => {
  const [selection, setSelection] = useState<string[]>(['C4', 'E4']);

  const handleKeyClick = (note: string) => {
    setSelection(prev => [...prev.slice(1), note]);
  };

  const { lowNote, highNote, degree, fullIntervalName } = calculateInterval(selection[0], selection[1]);

  return (
    <div className="interval-container">
      <p className="page-content">因為有相同度數但實際距離不同，或不同度數但距離相同的問題，所以為了做區分，會在度數前面使用「完全」或「大/小」這兩種形容詞，其中差1458度稱為「完全」、差2467度稱為「大」。</p>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
        <PianoKeyboard 
          startNote="C4" endNote="E5" 
          onKeyClick={handleKeyClick} 
          showWhiteKeyPitchNames 
          showBlackKeyPitchNames
          showOctaveNumbers
        />
        
        <div className="interval-result" style={{flexDirection: 'column', gap: '1rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <div className="result-note-box">{lowNote.replace(/[0-9]/g, '')}</div>
             <div className="result-arrow">
                <span className="result-text">差 {degree} 度</span>
                <div className="arrow-line"></div>
             </div>
             <div className="result-note-box">{highNote.replace(/[0-9]/g, '')}</div>
          </div>
          
          <div className="result-note-box" style={{width: '250px', height: '60px', fontSize: '1.5rem'}}>
            {fullIntervalName}
          </div>
        </div>
      </div>
      <p className="instruction-text">點擊任意兩個琴鍵，計算相差幾度與對應形容</p>
    </div>
  );
};

export default QualityPage1;