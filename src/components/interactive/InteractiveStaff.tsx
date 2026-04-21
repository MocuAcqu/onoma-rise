import React, { useState } from 'react';
import * as Tone from 'tone';
import './InteractiveStaff.css';

type NoteData = {
  pitch: string;       
  position: number;    
  pitchName?: string;  
  solfege?: string;    
  numberNotation?: string;
  hasLedgerLine?: boolean;
  isHighOctave?: boolean;
  accidental?: string; // '#' | 'b' | 'natural'
  hideStem?: boolean;
};

type InteractiveStaffProps = {
  notes: NoteData[];
  onKeyClick?: (note: NoteData) => void; 
};

// 複用鋼琴音源
const pianoSampler = new Tone.Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3"
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

const InteractiveStaff: React.FC<InteractiveStaffProps> = ({ notes, onKeyClick }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleNoteClick = (note: NoteData, index: number) => {
    Tone.start();
    pianoSampler.triggerAttackRelease(note.pitch, '2n', Tone.now(), 0.8);
    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 1000);
    if (onKeyClick) { onKeyClick(note);}
  };

  const NOTE_SPACING = 60; // 每個音符之間的距離
  const INITIAL_OFFSET = 30; // 第一個音符距離左邊的初始偏移量
  
  // 計算音符群組的總寬度：最後一個音符的位置 + 額外留白
  const totalNotesWidth = (notes.length - 1) * NOTE_SPACING + INITIAL_OFFSET * 2;

  return (
    <div className="staff-container">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="staff-line"></div>
      ))}
      
      <div className="notes-wrapper" style={{ width: `${totalNotesWidth}px` }}>
        {notes.map((note, index) => {
          const baseX = index * NOTE_SPACING + INITIAL_OFFSET;
          
          return (
            <React.Fragment key={index}>
              <div
                className={`staff-note ${index === activeIndex ? 'active' : ''}`}
                style={{ 
                  left: `${baseX}px`,
                  bottom: `${note.position * 10}px` 
                }}
                onClick={() => handleNoteClick(note, index)}
              >
                {note.hasLedgerLine && <div className="ledger-line"></div>}
                
                {/* --- 實心符頭 --- */}
                <div className="note-head"></div>
                
                {/* --- 如果沒有設定 hideStem，才畫符幹 --- */}
                {!note.hideStem && <div className="note-stem"></div>}
                
                {/* 變音記號 */}
                {note.accidental === '#' && <span className="accidental-inline">♯</span>}
                {note.accidental === 'b' && <span className="accidental-inline">♭</span>}
                {note.accidental === 'natural' && <span className="accidental-inline">♮</span>}
              </div>
              
              {/* 標籤區 */}
              <div 
                className="note-labels"
                style={{ left: `${baseX}px` }}
              >
                {note.pitchName && <div className="note-pitch-name">{note.pitchName}</div>}
                {note.solfege && <div className="note-solfege">{note.solfege}</div>}
                {note.numberNotation && (
                <div className={`note-number ${note.isHighOctave ? 'high-octave' : ''}`}>
                  {note.numberNotation}
                </div>
              )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  );
};

export default InteractiveStaff;