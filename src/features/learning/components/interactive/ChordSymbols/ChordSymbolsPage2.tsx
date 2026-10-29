import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import './ChordSymbols.css';

const MINOR_CHORDS = [
  { name: 'Cm', notes: ['C4', 'Eb4', 'G4'], label: 'Cm' },
  { name: 'Cm7', notes: ['C4', 'Eb4', 'G4', 'Bb4'], label: 'Cm7' },
  { name: 'Cm9', notes: ['C4', 'Eb4', 'G4', 'Bb4', 'D5'], label: 'Cm9' },
  { name: 'Cm11', notes: ['C4', 'Eb4', 'G4', 'Bb4', 'D5', 'F5'], label: 'Cm11' },
  { name: 'Cm13', notes: ['C4', 'Eb4', 'G4', 'Bb4', 'D5', 'F5', 'Ab5'], label: 'Cm13' },
];

const ChordSymbolsPage2 = () => {
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
        一律加上「小寫 m」字尾，除了小三和弦不用加數字之外，七和弦以上都要加上數字。此外，可以用「-」符號來代替小寫 m 文字。
      </p>

      <div className="chord-interactive-area">
        <div className="staff-image-wrapper">
          <img 
            src="/assets/chord-minor-staff.png" 
            alt="Minor Chords Staff" 
            className="staff-main-image"
          />
          <div className="chord-hotzones">
            {MINOR_CHORDS.map((chord, index) => (
              <div 
                key={chord.name}
                className={`chord-hotzone ${activeChord === chord.name ? 'active' : ''}`}
                style={{ left: `${index * 20}%`, width: '20%' }}
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

export default ChordSymbolsPage2;