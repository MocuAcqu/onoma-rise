import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import './ChordSymbols.css'; 

const MAJOR_CHORDS = [
  { name: 'C', notes: ['C4', 'E4', 'G4'], label: 'C' },
  { name: 'Cmaj7', notes: ['C4', 'E4', 'G4', 'B4'], label: 'Cmaj7' },
  { name: 'Cmaj9', notes: ['C4', 'E4', 'G4', 'B4', 'D5'], label: 'Cmaj9' },
  { name: 'Cmaj11', notes: ['C4', 'E4', 'G4', 'B4', 'D5', 'F5'], label: 'Cmaj11' },
  { name: 'Cmaj13', notes: ['C4', 'E4', 'G4', 'B4', 'D5', 'F5', 'A5'], label: 'Cmaj13' },
];

const ChordSymbolsPage1 = () => {
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: { C4: "C4.mp3", A4: "A4.mp3", "D#4": "Ds4.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    return () => { samplerRef.current?.dispose(); };
  }, []);

  // 先單音(Arpeggio)，後合聲(Chord)
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
        除了三個音的「大三和弦」不加任何字尾之外，大七和弦以上都一律加上「maj」字尾，表示 major。此外，也可以用「Δ」符號來代替 maj 文字。
      </p>

      <div className="chord-interactive-area">
        <div className="staff-image-wrapper">
          <img 
            src="/assets/chord-major-staff.png"
            alt="Major Chords Staff" 
            className="staff-main-image"
          />
          
          <div className="chord-hotzones">
            {MAJOR_CHORDS.map((chord, index) => (
              <div 
                key={chord.name}
                className={`chord-hotzone ${activeChord === chord.name ? 'active' : ''}`}
                style={{ left: `${index * 20}%`, width: '20%' }} // 根據圖片比例調整
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

export default ChordSymbolsPage1;