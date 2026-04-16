import { useState, useRef } from 'react';
import * as Tone from 'tone';
import { IoPlayCircle } from 'react-icons/io5';

const TWO_OCTAVES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

const PitchClassSetPage2 = () => {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [freq, setFreq] = useState<number>(0);
  
  const sampler = useRef(new Tone.Sampler({
    urls: { C4: "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination());

  const playSequence = async () => {
    await Tone.start();
    let i = 0;
    const interval = setInterval(() => {
      const note = TWO_OCTAVES[i];
      setActiveNote(note);
      setFreq(Number(Tone.Frequency(note).toFrequency().toFixed(2)));
      sampler.current.triggerAttackRelease(note, "8n");
      
      i++;
      if (i >= TWO_OCTAVES.length) {
        clearInterval(interval);
        setTimeout(() => setActiveNote(null), 500);
      }
    }, 400);
  };

  return (
    <div className="pitch-set-container">
      <p className="page-content" style={{marginTop:'5%'}}>
        七個音名會被循環做使用，延伸出更多的音，其中音越高，頻率就越高。
      </p>
      <div className="page2-set">
        <div className="formula-card" style={{width:'18rem',height:'4.5rem'}} >
            <span className="formula-main" style={{fontSize:'1.2rem',color:'#4b4b4b'}}>目前頻率: </span>
            <span className="formula-result" style={{fontSize:'1.5rem'}}>{freq > 0 ? `${freq} Hz` : ''}</span>
        </div>

        <button className="play-btn" onClick={playSequence}>
            <IoPlayCircle size={70} color='#DA8F86'/>
        </button>
      </div>

      <div className="stairs-wrapper" style={{ height: '410px' }}>
        {TWO_OCTAVES.map((note, index) => (
          <div 
            key={note} 
            className={`stair-step ${activeNote === note ? 'active' : ''}`} 
            style={{ '--step-index': index, width: '40px' } as any}
          >
            <span className="pitch-letter" style={{ fontSize: '1rem', top: '-25px' }}>
              {note.replace(/[0-9]/g, '')}
            </span>
          </div>
        ))}
      </div>
      <p className="instruction-text">點擊播放鍵，聆聽低音到高音的過程</p>
      
      
      
    </div>
  );
};
export default PitchClassSetPage2;