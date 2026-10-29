import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import WaveformCanvas from '../WaveformCanvas';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import './SoundFormation.css';

const SoundFormationPage2 = () => {
  const [vol, setVol] = useState(20);
  const [isMuted, setIsMuted] = useState(true);
  const osc = useRef<Tone.Oscillator | null>(null);

  useEffect(() => {
    osc.current = new Tone.Oscillator(261.63, "sine").toDestination();
    osc.current.start();
    return () => { osc.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (osc.current) {
      osc.current.volume.rampTo(isMuted ? -Infinity : vol - 40, 0.1);
    }
  }, [vol, isMuted]);

  return (
    <div className="page-content formation-page">
      <div className="formation-layout">
        <div className="visual-side">
           <WaveformCanvas amplitude={vol * 1.5} frequency={300} waveType="sine" />
        </div>
        <div className="control-side">
          <p className="side-desc">聲音的「音量」(響度) 受到聲波的「振動幅度大小」影響。定義為單位面積、單位時間內接收到的聲波能量，以分貝(db) 為音量單位。</p>
          <div className="freq-display-wrapper" style={{ width: '100%' }}>
            <span className="freq-value" style={{ marginLeft: '13%' }}>{vol} db</span>
            <button className={`mute-btn ${!isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
          </div>
          <div className="slider-container">
            <input type="range" min="0" max="50" value={vol} onChange={(e)=>setVol(Number(e.target.value))} className="freq-slider" style={{'--progress': `${(vol/50)*100}%`} as any} />
          </div>
          <p className="sub-instruction">振幅越大，聲音越響</p>
        </div>
      </div>
    </div>
  );
};
export default SoundFormationPage2;