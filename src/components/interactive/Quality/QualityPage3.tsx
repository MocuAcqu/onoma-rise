import { useState, useMemo, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { calculateInterval } from '../Interval/IntervalUtils';
import '../Interval/IntervalDefinition.css';

const STAFF_POSITIONS = [
  { id: 1, pos: -20, pitchName: 'C4', isLine: true, hasLedger: true }, // 下加一線 (C4)
  { id: 2, pos: -10, pitchName: 'D4', isLine: false }, // 下加一間 (D4)
  { id: 3, pos: 0, pitchName: 'E4', isLine: true },    // 第一線 (E4)
  { id: 4, pos: 10, pitchName: 'F4', isLine: false },  // 第一間 (F4)
  { id: 5, pos: 20, pitchName: 'G4', isLine: true },   // 第二線 (G4)
  { id: 6, pos: 30, pitchName: 'A4', isLine: false },  // 第二間 (A4)
  { id: 7, pos: 40, pitchName: 'B4', isLine: true },   // 第三線 (B4)
  { id: 8, pos: 50, pitchName: 'C5', isLine: false },  // 第三間 (C5)
  { id: 9, pos: 60, pitchName: 'D5', isLine: true },   // 第四線 (D5)
  { id: 10, pos: 70, pitchName: 'E5', isLine: false }, // 第四間 (E5)
];

const QualityPage3 = () => {
  const [targetPosId, setTargetPosId] = useState(3);
  const [accidental, setAccidental] = useState<'#' | 'b' | 'natural' | null>(null);
  
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
      samplerRef.current = new Tone.Sampler({
        urls: { C4: "C4.mp3" },
        baseUrl: "https://tonejs.github.io/audio/salamander/"
      }).toDestination();
      return () => { samplerRef.current?.dispose(); };
    }, []);

  // 根據選擇的位置和記號，組合出真實的音高字串
  const targetNote = useMemo(() => {
    const baseObj = STAFF_POSITIONS.find(p => p.id === targetPosId);
    if (!baseObj) return 'E4';
    
    let pitch = baseObj.pitchName;
    if (accidental === '#') pitch = pitch.replace(/(\D)/, '$1#');
    if (accidental === 'b') pitch = pitch.replace(/(\D)/, '$1b');
    return pitch;
  }, [targetPosId, accidental]);

  // 計算音程
  const { fullIntervalName } = calculateInterval('C4', targetNote);

  const handleStaffClick = async (posId: number) => {
    await Tone.start();
    setTargetPosId(posId);
    
    // 計算新位置的音高並發聲
    const newBasePitch = STAFF_POSITIONS.find(p => p.id === posId)?.pitchName || 'E4';
    let pitchToPlay = newBasePitch;
    if (accidental === '#') pitchToPlay = pitchToPlay.replace(/(\D)/, '$1#');
    if (accidental === 'b') pitchToPlay = pitchToPlay.replace(/(\D)/, '$1b');
    
    samplerRef.current?.triggerAttackRelease(pitchToPlay, '4n');
  };

  const handleAccClick = async (acc: '#' | 'b' | 'natural') => {
    await Tone.start();
    // 如果點擊的是已經啟用的記號，則取消；否則啟用新記號
    const newAcc = accidental === acc ? null : acc;
    setAccidental(newAcc);

    // 重新發聲
    const basePitch = STAFF_POSITIONS.find(p => p.id === targetPosId)?.pitchName || 'E4';
    let pitchToPlay = basePitch;
    if (newAcc === '#') pitchToPlay = pitchToPlay.replace(/(\D)/, '$1#');
    if (newAcc === 'b') pitchToPlay = pitchToPlay.replace(/(\D)/, '$1b');
    
    samplerRef.current?.triggerAttackRelease(pitchToPlay, '4n');
  };

  const targetY = STAFF_POSITIONS.find(p => p.id === targetPosId)?.pos || 0;
  const targetHasLedger = STAFF_POSITIONS.find(p => p.id === targetPosId)?.hasLedger;

  return (
    <div className="interval-container">
      <p className="page-content">若遇到非大調音階、當中包含著升降符號的情況時，可根據升或降幾個半音去改變形容詞，決定度的名稱。</p>
      
      <div className="quality-lab-v2">
        <div className="custom-staff-area">
          <div className="clef-overlay">𝄞</div>
          
          <div className="custom-staff-lines">
            <div className="c-line" style={{ bottom: '80px' }}></div>
            <div className="c-line" style={{ bottom: '60px' }}></div>
            <div className="c-line" style={{ bottom: '40px' }}></div>
            <div className="c-line" style={{ bottom: '20px' }}></div>
            <div className="c-line" style={{ bottom: '0px' }}></div>
          </div>

          {/* 隱形的點擊熱區 */}
          <div className="click-zones">
            {STAFF_POSITIONS.map(pos => (
              <div 
                key={pos.id} 
                className="click-zone" 
                style={{ bottom: `${pos.pos + 20}px` }} // +20 是因為第一線設為 0，但在容器中它距離底部是 20px
                onClick={() => handleStaffClick(pos.id)}
              ></div>
            ))}
          </div>

          {/* 固定的 C4 音符 */}
          <div className="custom-note static-c4" style={{ bottom: '0px', left: '100px' }}>
            <div className="c-ledger-line"></div>
            <div className="c-note-head black-head"></div>
          </div>

          {/* 可動的橘色音符 */}
          <div 
            className="custom-note movable-note" 
            style={{ 
              bottom: `${targetY + 20}px`, 
              left: '180px',
              transition: 'bottom 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {targetHasLedger && <div className="c-ledger-line"></div>}
            
            {/* 變音記號顯示 */}
            {accidental === '#' && <span className="c-accidental">♯</span>}
            {accidental === 'b' && <span className="c-accidental">♭</span>}
            {accidental === 'natural' && <span className="c-accidental">♮</span>}
            
            <div className="c-note-head orange-head"></div>
          </div>
        </div>

        <div className="accidental-controls-v2">
          <button className={`acc-btn-v2 ${accidental === '#' ? 'active' : ''}`} onClick={() => handleAccClick('#')}>♯</button>
          <button className={`acc-btn-v2 ${accidental === 'b' ? 'active' : ''}`} onClick={() => handleAccClick('b')}>♭</button>
          <button className={`acc-btn-v2 ${accidental === 'natural' ? 'active' : ''}`} onClick={() => handleAccClick('natural')}>♮</button>
        </div>
      </div>

      <div className="result-note-box" style={{width: '250px', height: '60px', fontSize: '1.5rem', margin: '2rem 0'}}>
        {fullIntervalName}
      </div>

      <p className="instruction-text">點擊五線譜改變橘色音符高度，或從右側加上符號，查看度的名稱</p>
    </div>
  );
};

export default QualityPage3;