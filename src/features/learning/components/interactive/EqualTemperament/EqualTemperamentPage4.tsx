import { useState } from 'react';
import PianoKeyboard from '../PianoKeyboard';

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const EqualTemperamentPage4 = () => {
  const [activePitch, setActivePitch] = useState('C');

  return (
    <div className="et-container">
        <p className="page-content">十二個音的循環，形成了鍵盤上的八度音階，以七個白鍵、五個黑鍵組合而成，下方左側便是對應的半音圈，也就是每個音之間相差半音。</p>
      <div className="chromatic-layout">
        <svg className="circle-svg" viewBox="0 0 200 200">
          {PITCH_CLASSES.map((pc, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 100 + 70 * Math.cos(angle);
            const y = 100 + 70 * Math.sin(angle);
            return (
              <g key={pc}>
                <circle 
                  cx={x} cy={y} r="15" 
                  className={`circle-node ${activePitch === pc ? 'active' : ''}`} 
                />
                <text x={x} y={y} dy="5" textAnchor="middle" className="circle-text">{pc}</text>
              </g>
            );
          })}
        </svg>
        <PianoKeyboard 
          startNote="C4" endNote="B4" 
          showWhiteKeyPitchNames={true}
          showBlackKeyPitchNames={true}
          onKeyClick={(note) => setActivePitch(note.replace(/[0-9]/g, ''))}
        />
      </div>
      <p className="instruction-text">點擊琴鍵，查看對應半音圈位置</p>
    </div>
  );
};
export default EqualTemperamentPage4;