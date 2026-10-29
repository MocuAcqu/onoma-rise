import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import './ChordSymbols.css';

const DOMINANT_CHORDS = [
  { name: 'C7', notes: ['C4', 'E4', 'G4', 'Bb4'], label: 'C7' },
  { name: 'C9', notes: ['C4', 'E4', 'G4', 'Bb4', 'D5'], label: 'C9' },
  { name: 'C11', notes: ['C4', 'E4', 'G4', 'Bb4', 'D5', 'F5'], label: 'C11' },
  { name: 'C13', notes: ['C4', 'E4', 'G4', 'Bb4', 'D5', 'F5', 'A5'], label: 'C13' },
];

const ChordSymbolsPage3 = () => {
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: { C4: "C4.mp3", A4: "A4.mp3", "D#4": "Ds4.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    return () => { samplerRef.current?.dispose(); };
  }, []);

  const handlePlayChord = async (chordName: string, notes: string[]) => {
    await Tone.start();
    if (activeChord) return;
    setActiveChord(chordName);
    const now = Tone.now();

    notes.forEach((note, index) => {
      samplerRef.current?.triggerAttackRelease(note, "4n", now + index * 0.4);
    });

    const chordStartTime = now + notes.length * 0.4 + 0.2;
    samplerRef.current?.triggerAttackRelease(notes, "2n", chordStartTime);

    setTimeout(() => setActiveChord(null), (notes.length * 400) + 2000);
  };

  return (
    <div className="chord-symbols-container">
      <p className="page-content">
        屬和弦是從七和弦開始，一律直接在音名後加上數字就好。
      </p>

      <div className="chord-interactive-area">
        <div className="staff-image-wrapper">
          <img 
            src="/assets/chord-dominant-staff.png" 
            alt="Dominant Chords Staff" 
            className="staff-main-image"
          />
          <div className="chord-hotzones">
            {DOMINANT_CHORDS.map((chord, index) => (
              <div 
                key={chord.name}
                className={`chord-hotzone ${activeChord === chord.name ? 'active' : ''}`}
                style={{ left: `${index * 25}%`, width: '25%' }} 
                onClick={() => handlePlayChord(chord.name, chord.notes)}
              >
                <span className="chord-badge">{chord.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="instruction-text">點擊對應位置五線譜，聆聽和弦聲音</p>
    </div>
  );
};

export default ChordSymbolsPage3;