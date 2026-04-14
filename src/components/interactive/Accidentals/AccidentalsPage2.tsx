import { useState } from 'react';
import PianoKeyboard from '../PianoKeyboard';
import './AccidentalsStyles.css';

// 定義黑鍵對應的同音異名資料
const enharmonicMap: Record<string, { base1: string, result1: string, base2: string, result2: string }> = {
  'C#4': { base1: 'C', result1: 'C#', base2: 'D', result2: 'D♭' },
  'D#4': { base1: 'D', result1: 'D#', base2: 'E', result2: 'E♭' },
  'F#4': { base1: 'F', result1: 'F#', base2: 'G', result2: 'G♭' },
  'G#4': { base1: 'G', result1: 'G#', base2: 'A', result2: 'A♭' },
  'A#4': { base1: 'A', result1: 'A#', base2: 'B', result2: 'B♭' },
};

const Page2 = () => {
  // 預設顯示 C# / Db 的關係
  const [currentPair, setCurrentPair] = useState(enharmonicMap['C#4']);

  const handleKeyClick = (note: string, type: 'white' | 'black') => {
    // 只有點擊黑鍵時才更新圖解
    if (type === 'black' && enharmonicMap[note]) {
      setCurrentPair(enharmonicMap[note]);
    }
  };

  return (
    <div className="page-content">
      <p>一個八度音平均分成12個音，每等份為一個「半音」。而升記號 # 代表升高半音，降記號 ♭ 代表降低半音，造成會有「同音異名」的情況。</p>
      
      <div className="enharmonic-container">
        {/* 左側鋼琴 */}
        <PianoKeyboard 
          startNote="C4" 
          endNote="B4" 
          showWhiteKeyPitchNames={true}
          showBlackKeyPitchNames={true}
          onKeyClick={handleKeyClick} 
        />

        {/* 右側動態圖解 */}
        <div className="diagram-area">
          <div className="diagram-row">
            <div className="note-box input-box">{currentPair.base1}</div>
            <div className="arrow-group">
              <span className="arrow-text">升半音</span>
              <div className="arrow-line"></div>
            </div>
            <div className="note-box result-box blue-border">{currentPair.result1}</div>
          </div>
          
          <div className="diagram-row">
            <div className="note-box input-box">{currentPair.base2}</div>
            <div className="arrow-group">
              <span className="arrow-text">降半音</span>
              <div className="arrow-line"></div>
            </div>
            <div className="note-box result-box">{currentPair.result2}</div>
          </div>
        </div>
      </div>

      <p className="instruction-text">點擊黑鍵聆聽聲音，查看右側此鍵對應的音</p>
    </div>
  );
};

export default Page2;