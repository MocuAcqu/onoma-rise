import React, { useState } from 'react';
import * as Tone from 'tone';
import './ChordStaff.css';
import { getNoteY, getAccidental } from './Triads/ChordUtils';

type ChordStaffProps = {
  notes: string[];
};

const pianoSampler = new Tone.Sampler({
  urls: { C4: "C4.mp3", A4: "A4.mp3", "D#4": "Ds4.mp3" },
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

const ChordStaff: React.FC<ChordStaffProps> = ({ notes }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playChord = async () => {
    if (isPlaying) return;
    await Tone.start();
    setIsPlaying(true);
    pianoSampler.triggerAttackRelease(notes, "1n", Tone.now(), 0.8);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  return (
    <div className={`chord-staff-container ${isPlaying ? 'playing' : ''}`} onClick={playChord}>
      <div className="clef-overlay">𝄞</div>
      <div className="staff-lines-group">
        {[0, 16, 32, 48, 64].map(bottom => (
          <div key={bottom} className="staff-line" style={{ bottom: `${bottom}px` }}></div>
        ))}
      </div>
      
      <div className="chord-notes-stack">
        {notes.map(note => {
          const y = getNoteY(note);
          const accidental = getAccidental(note); 
          const needsLedger = note.startsWith('C4'); 
          
          return (
            <div key={note} className="chord-note-item" style={{ bottom: `${y}px` }}>
              {needsLedger && <div className="chord-ledger-line"></div>}
              {accidental && <span className="accidental-mark-staff">{accidental}</span>}
              <div className="chord-note-head"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChordStaff;