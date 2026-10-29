import { useState } from 'react';
import PianoKeyboard from '../PianoKeyboard';
import { getETCalculation } from './ETUtils';
import './EqualTemperament.css';

const EqualTemperamentPage1 = () => {
  const [calc, setCalc] = useState(getETCalculation('C4'));

  return (
    <div className="et-container">
      <p className="page-content">是現代音樂理論中最主流定律方式，在聲音軸上找到互相和諧的聲音頻率，來確定為固定音符，是以某個基準音乘以「 2 的 12 次方根的 i 次方」確認其他音的位置  (基準音習慣以 440 Hz 為準)。</p>
      <div className="formula-card" style={{width:'29rem'}}>
        <span className="formula-main">{calc.formula}</span>
        <span className="formula-main">=</span>
        <span className="formula-result">{calc.frequency} Hz</span>
      </div>
      <PianoKeyboard 
        startNote="F3" endNote="G5" 
        showWhiteKeyPitchNames={true}
        showOctaveNumbers={true}
        showBlackKeyPitchNames={true}
        onKeyClick={(note) => setCalc(getETCalculation(note))}
      />
      <p className="instruction-text">點擊琴鍵彈奏聲音，查看對應頻率計算</p>
    </div>
  );
};
export default EqualTemperamentPage1;