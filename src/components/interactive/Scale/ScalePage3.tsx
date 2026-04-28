import { useState, useRef } from 'react';
import * as Tone from 'tone';
import { IoPlayCircle } from 'react-icons/io5';
import './ScaleDefinition.css';

const CHROMATIC_SCALE = [
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
];

const ENHARMONIC_MAP: Record<string, string> = {
  'C#': 'D♭',
  'D#': 'E♭',
  'F#': 'G♭',
  'G#': 'A♭',
  'A#': 'B♭'
};

const ScalePage3 = () => {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const sampler = useRef(new Tone.Sampler({
    urls: { C4: "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination());

  const playSequence = async () => {
    await Tone.start();
    let i = 0;
    const interval = setInterval(() => {
      const note = CHROMATIC_SCALE[i];
      setActiveNote(note);
      sampler.current.triggerAttackRelease(note, "4n");
      
      i++;
      if (i >= CHROMATIC_SCALE.length) {
        clearInterval(interval);
        setTimeout(() => setActiveNote(null), 500);
      }
    }, 500);
  };

  return (
    <div className="page-content">
      <p>可以想像成是用「音符」做出來的「階梯」，根據爬的方式不同，有不同音階類型，在各種音階中，半音和全音的排列模式都是固定不變的，音階起始的第一個音，稱為音階的主音。</p>
      
      <div style={{ alignSelf: 'flex-end', marginRight: '2rem' }}>
        <button className="play-btn" onClick={playSequence} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom:'1rem' }}>
          <IoPlayCircle size={65} color="var(--color-button-blue)" />
        </button>
      </div>

      <div className="chromatic-stairs-wrapper">
        {CHROMATIC_SCALE.map((note, index) => {
          const isBlackKey = note.includes('#');
          const pitchName = note.replace(/[0-9]/g, ''); 
          return (
            <div 
              key={note} 
              className={`chromatic-step ${isBlackKey ? 'black-step' : 'white-step'} ${activeNote === note ? 'active' : ''}`} 
              style={{ '--step-index': index } as any}
            >
              <span className="step-label">
                {isBlackKey ? (
                  <>
                    {pitchName}<br/>
                    <span style={{fontSize:'0.65em'}}>{ENHARMONIC_MAP[pitchName]}</span>
                  </>
                ) : (
                  pitchName
                )}
              </span>
            </div>
          )
        })}
      </div>

      <p className="instruction-text">點擊播放鍵，聆聽從主音出發，每一階依序發出的聲音</p>
    </div>
  );
};

export default ScalePage3;