import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './SolfegeStyles.css';

// 再次使用音源
const pianoSampler = new Tone.Sampler({ /* ... */ }).toDestination();

const scales: { [key: string]: string[] } = {
  'C': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
  'D': ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5'], 
  'E': ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5'],
  'F': ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5'],   
  'G': ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5'],   
  'A': ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5'],
  'B': ['B4', 'C#5', 'D#5', 'E5', 'F#5', 'G#5', 'A#5'],
};
const solfegeNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];

const SolfegePage3 = () => {
  const [selectedKey, setSelectedKey] = useState('C');
  const [isLoaded, setIsLoaded] = useState(false);
  const currentScale = scales[selectedKey];
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: {
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3"
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();

    Tone.loaded().then(() => setIsLoaded(true));

    return () => {
      samplerRef.current?.dispose();
    };
  }, []);

  const playNote = async (pitch: string) => {
    await Tone.start();
    if (isLoaded && samplerRef.current) {
      samplerRef.current.triggerAttackRelease(pitch, '8n'); 
    }
  };

  const sortedKeys = Object.keys(scales).sort();

  return (
    <div className="page-content">
      <p>唱名會根據調性不同，對應不同音高，因此是「相對音高」。</p>
      
      <div className="relative-pitch-tool">
        <div className="controls">
          <select 
            value={selectedKey} 
            onChange={(e) => setSelectedKey(e.target.value)}
            className="key-selector"
          >
            {sortedKeys.map(key => (
              <option key={key} value={key}>{key} 大調</option>
            ))}
          </select>
          <span className="key-info">{selectedKey} major : Do = {scales[selectedKey][0]}</span>
        </div>

        <div className="solfege-grid">
          {/* 唱名列 */}
          <div className="solfege-row">
            {solfegeNames.map(name => (
              <div key={name} className="note-box solfege-box">{name}</div>
            ))}
          </div>
          {/* 音名列 */}
          <div className="solfege-row">
            {currentScale.map(pitch => (
              <button key={pitch} className="note-box pitch-box" onClick={() => playNote(pitch)} disabled={!isLoaded}>
                {pitch.replace(/[0-9]/g, '')}
              </button>
            ))}
          </div>
        </div>
        <p className="instruction-text">選擇調性查看對應唱名，點擊音名可聆聽聲音</p>
      </div>
    </div>
  );
};

export default SolfegePage3;