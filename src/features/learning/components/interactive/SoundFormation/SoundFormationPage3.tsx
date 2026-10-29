import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import WaveformCanvas from '../WaveformCanvas';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import './SoundFormation.css';

const SoundFormationPage3 = () => {
  const [freq, setFreq] = useState(440);
  const [isMuted, setIsMuted] = useState(true);
  const osc = useRef<Tone.Oscillator | null>(null);

  useEffect(() => {
    osc.current = new Tone.Oscillator(freq, "sine").toDestination();
    osc.current.start();
    return () => { osc.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (osc.current) {
      osc.current.frequency.rampTo(freq, 0.1);
      osc.current.volume.value = isMuted ? -Infinity : -10;
    }
  }, [freq, isMuted]);

  return (
    <div className="page-content formation-page">
      <div className="formation-layout">
        <div className="visual-side">
           <WaveformCanvas amplitude={40} frequency={freq} waveType="sine" />
        </div>
        <div className="control-side">
          <p className="side-desc">聲音的「音高」(頻率) 受到聲波的「振動頻率快慢」影響。波形鬆，音調低；波形密，音調高，人耳可以聽到的範圍為 20 Hz 到 20000 Hz。</p>
          <div className="freq-display-wrapper" style={{ width: '100%' }}>
            <span className="freq-value" style={{ marginLeft: '13%' }}>{freq} Hz</span>
            <button className={`mute-btn ${!isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
          </div>
          <div className="slider-container">
            <input type="range" min="0" max="1000" value={freq} onChange={(e)=>setFreq(Number(e.target.value))} className="freq-slider" style={{'--progress': `${((freq-0)/1000)*100}%`} as any} />
          </div>
          <p className="sub-instruction">波形越密，音調越高</p>
        </div>
      </div>
    </div>
  );
};
export default SoundFormationPage3;