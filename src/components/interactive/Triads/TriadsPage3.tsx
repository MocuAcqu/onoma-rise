import { useState, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import PianoKeyboard from '../PianoKeyboard';

const RATIOS = [
  { label: '3/2', val: 1.5 },
  { label: '5/4', val: 1.25 },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TriadsPage3 = () => {
  const [baseNote, setBaseNote] = useState('A3');
  const [ratio, setRatio] = useState(2.0);
  const [statusText, setStatusText] = useState('');
  const [isLocked, setIsLocked] = useState(false); 
  
  const sampler = useRef(new Tone.Sampler({
    urls: { A3: "A3.mp3", C4: "C4.mp3", A4: "A4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination());

  const info = useMemo(() => {
    const baseFreq = Tone.Frequency(baseNote).toFrequency();
    const targetFreq = baseFreq * ratio;
    const targetNote = Tone.Frequency(targetFreq).toNote();
    return { baseFreq, targetFreq, targetNote };
  }, [baseNote, ratio]);

  const playSequence = async (newBase?: string) => {
    if (isLocked) return; 
    const currentBase = newBase || baseNote;
    await Tone.start();
    setIsLocked(true); 
    
    // 播放序列邏輯
    const now = Tone.now();
    
    setStatusText('▶ 播放原音...');
    sampler.current.triggerAttackRelease(currentBase, "2n", now);
    await delay(1500);
    
    setStatusText('▶ 播放計算後的音...');
    sampler.current.triggerAttackRelease(info.targetNote, "2n", now + 1.5);

    await delay(1500);
    
    setStatusText('♫ 播放合聲!');
    sampler.current.triggerAttackRelease([currentBase, info.targetNote], "1n", now + 3);

    setTimeout(() => {setStatusText(''); setIsLocked(false);}, 2000);
  };

  return (
    <div className="pitch-set-container">
      <p className="page-content" style={{marginTop:'5%'}}>
        頻率若有「倍數」或是「小整數比」的音混雜在一起聽起來會比較和諧，其中五度約 3 : 2，大三度約 5 : 4。
      </p>
      <div className="harmonic-comparison-area">
        <div className="note-info-card">
          <span className="card-title">{baseNote}</span>
          <span className="card-freq">{info.baseFreq.toFixed(2)} Hz</span>
        </div>

        <div className="math-operator">×</div>

        <div className="ratio-selector-container">
          <select 
            className="ratio-dropdown" 
            value={ratio} 
            onChange={(e) => setRatio(Number(e.target.value))}
          >
            {RATIOS.map(r => <option key={r.label} value={r.val}>{r.label}</option>)}
          </select>
        </div>

        <div className="math-operator">≈</div>

        <div className="note-info-card">
          <span className="card-title" style={{color: '#DA8F86'}}>{info.targetNote}</span>
          <span className="card-freq">{info.targetFreq.toFixed(2)} Hz</span>
        </div>
      </div>

      <div className="play-sequence-indicator">{statusText}</div>
      <div className={isLocked ? "keyboard-locked" : ""}>
        <PianoKeyboard 
            startNote="C3" endNote="B4" 
            onKeyClick={(note) => {
            setBaseNote(note);
            playSequence(note);
            if (!isLocked) playSequence(note);
            }} 
            showWhiteKeyPitchNames
            showBlackKeyPitchNames 
        />
      </div>
      
      <p className="instruction-text">可透過下拉選單改變倍數，點擊琴鍵聆聽和聲</p>
    </div>
  );
};
export default TriadsPage3;