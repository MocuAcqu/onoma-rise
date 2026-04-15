import { useState } from 'react';
import PianoKeyboard from '../PianoKeyboard';
import { getETCalculation } from './ETUtils';
import './EqualTemperament.css';

const EqualTemperamentPage1 = () => {
  const [calc, setCalc] = useState(getETCalculation('C4'));

  return (
    <div className="et-container">
      <p className="page-content">一個八度音平均分布成 12 個音，每個頻率的間隔剛剛好分成十二等份，也因此以 12 為一個循環，任何一個音的兩倍頻率音，其音名相同。</p>
      <div className="formula-card" style={{width:'29rem'}}>
        <span className="formula-main">{calc.formula}</span>
        <span className="formula-main">=</span>
        <span className="formula-result">{calc.frequency} Hz</span>
      </div>
      <PianoKeyboard 
        startNote="C4" endNote="B5" 
        showWhiteKeyPitchNames={true}
        showOctaveNumbers={true}
        showBlackKeyPitchNames={true}
        onKeyClick={(note) => setCalc(getETCalculation(note))}
      />
      <p className="instruction-text">點擊相同音名之琴鍵彈，比對應頻率計算</p>
    </div>
  );
};
export default EqualTemperamentPage1;