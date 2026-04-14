import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import WaveformCanvas from '../WaveformCanvas2';
import './SoundFormation.css';

const INSTRUMENTS_CONFIG: Record<string, any> = {
  sine: { name: '正弦波', type: 'synth' },
  piano: { 
    name: '鋼琴', 
    type: 'sampler', 
    urls: { C4: "C4.mp3" }, 
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/" 
  },
  guitar: { 
    name: '吉他', 
    type: 'sampler', 
    urls: { A3: "A3.mp3" }, 
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/" 
  },
  trumpet: { 
    name: '小喇叭', 
    type: 'sampler', 
    urls: { C4: "C4.mp3" }, 
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trumpet/" 
  },
  handpan: { 
    name: '長笛', 
    type: 'sampler', 
    urls: { C4: "C4.mp3" }, 
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/flute/" 
  },
  drums: { 
    name: '爵士鼓', 
    type: 'sampler', 
    urls: { 
      C1: "kick.mp3", 
      D1: "snare.mp3",
      E1: "hihat.mp3"
    }, 
    baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/" 
  }
};

const MELODY = [
  { time: "0:0", note: "C4" }, { time: "0:1", note: "C4" },
  { time: "0:2", note: "G4" }, { time: "0:3", note: "G4" },
  { time: "1:0", note: "A4" }, { time: "1:1", note: "A4" },
  { time: "1:2", note: "G4" }
];

const SoundFormationPage4 = () => {
  const [currentIns, setCurrentIns] = useState('sine');
  const [loadCount, setLoadCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const samplers = useRef<Record<string, Tone.Sampler>>({});
  const synth = useRef<Tone.PolySynth | null>(null);
  const analyser = useRef<Tone.Analyser | null>(null);

  useEffect(() => {
    analyser.current = new Tone.Analyser("waveform", 1024);
    synth.current = new Tone.PolySynth(Tone.Synth).connect(analyser.current).toDestination();

    Object.keys(INSTRUMENTS_CONFIG).forEach(key => {
      const config = INSTRUMENTS_CONFIG[key];
      if (config.type === 'sampler') {
        samplers.current[key] = new Tone.Sampler({
          urls: config.urls,
          baseUrl: config.baseUrl,
          onload: () => {
            console.log(`${config.name} 載入成功`);
            setLoadCount(prev => prev + 1);
          },
          onerror: (err) => console.error(`${config.name} 載入失敗:`, err)
        }).connect(analyser.current!).toDestination();
      }
    });

    return () => {
      Object.values(samplers.current).forEach(s => s.dispose());
      synth.current?.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  const playMelody = async (key: string) => {
    await Tone.start();
    setCurrentIns(key);
    
    // 停止所有先前的播放
    Tone.Transport.stop();
    Tone.Transport.cancel();

    const instrument = key === 'sine' ? synth.current : samplers.current[key];
    if (!instrument) return;

    setIsPlaying(true);

    const isDrums = key === 'drums';
    
    // 建立旋律
    new Tone.Part((time, value) => {
      // 鼓組特殊對應
      const noteToPlay = isDrums 
        ? (value.note.startsWith("G") ? "D1" : "C1") 
        : value.note;
      
      instrument.triggerAttackRelease(noteToPlay, "8n", time);
    }, MELODY).start(0);

    Tone.Transport.start();

    // 旋律大約 3-4 秒結束
    setTimeout(() => setIsPlaying(false), 3500);
  };

  const totalSamplers = Object.values(INSTRUMENTS_CONFIG).filter(i => i.type === 'sampler').length;
  const isAllLoaded = loadCount >= totalSamplers;

  return (
    <div className="page-content formation-page">
      <div className="formation-layout">
        <div className="visual-side">
          <WaveformCanvas analyser={analyser.current} />
        </div>
        
        <div className="control-side">
          <p className="side-desc">聲音的「音色」(音品) 受到聲波的「波形」影響。不同發音體皆有獨特的發音特色，而其中爵士鼓為非固定音高樂器，可嘗試比較樂器間的差異。</p>
          <div className="instrument-grid">
            {Object.keys(INSTRUMENTS_CONFIG).map((key) => (
              <button 
                key={key}
                className={`ins-btn ${currentIns === key ? 'active' : ''} ${isPlaying && currentIns === key ? 'playing' : ''}`}
                onClick={() => playMelody(key)}
                disabled={!isAllLoaded && INSTRUMENTS_CONFIG[key].type === 'sampler'}
              >
                {INSTRUMENTS_CONFIG[key].name}
              </button>
            ))}
          </div>
          <p className="sub-instruction">
            {isAllLoaded ? "請點擊樂器聆聽波形變化" : `正在準備樂器取樣... (${loadCount}/${totalSamplers})`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoundFormationPage4;