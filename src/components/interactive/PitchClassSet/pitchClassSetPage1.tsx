import { useState, useRef } from 'react';
import * as Tone from 'tone';
import './PitchClassSet.css';

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

const PitchClassSetPage1 = () => {
  const [jumpingNote, setJumpingNote] = useState<string | null>(null);
  const sampler = useRef(new Tone.Sampler({
    urls: { C4: "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination());

  const handleNoteClick = async (note: string) => {
    await Tone.start();
    sampler.current.triggerAttackRelease(note, "4n");
    setJumpingNote(note);
    sampler.current.triggerAttackRelease(note, "4n");
    setTimeout(() => setJumpingNote(null), 400);
  };

  return (
    <div className="pitch-set-container">
      <p className="page-content" style={{marginTop:'5%'}}>
        音高 (Pitch) 就是我們對聲音高低的感覺，即所謂的高音、低音。西洋音樂慣常使用頭 7 個英文字母 (A, B, C, D, E, F, G) 作為音名 (Pitch Name)。
      </p>
      <div className="stairs-wrapper">
        {NOTES.map((note, index) => (
          <div key={note} className="stair-step" style={{ '--step-index': index } as any} onClick={() => handleNoteClick(note)}>
            <span 
              className={`pitch-letter ${jumpingNote === note ? 'jumping' : ''}`}
              onClick={() => handleNoteClick(note)}
            >
              {note.replace(/[0-9]/g, '')}
            </span>
          </div>
        ))}
      </div>
      <p className="instruction-text">點擊音名聆聽聲音</p>
    </div>
  );
};
export default PitchClassSetPage1;