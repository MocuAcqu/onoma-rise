import React, { useMemo, useCallback } from 'react';
import * as Tone from 'tone';
import './PianoKeyboard.css';

// 定義所有音符，包含八度
const ALL_NOTES = [
  'A0', 'A#0', 'B0',
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
  'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
  'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6',
  'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7', 'A#7', 'B7',
  'C8'
];

type PianoKeyboardProps = {
  startNote: string;
  endNote: string;
  showWhiteKeyPitchNames?: boolean;
  showBlackKeyPitchNames?: boolean;
  showOctaveNumbers?: boolean;
  onKeyClick?: (note: string, type: 'white' | 'black') => void;
};

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
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/" // Tone.js 官方提供的音源庫
}).toDestination();

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startNote,
  endNote,
  showWhiteKeyPitchNames = false,
  showBlackKeyPitchNames = false,
  showOctaveNumbers = false,
  onKeyClick,
}) => {

  // 根據傳入的起點和終點音符，產生琴鍵
  const keys = useMemo(() => {
    const startIndex = ALL_NOTES.indexOf(startNote);
    const endIndex = ALL_NOTES.indexOf(endNote);
    if (startIndex === -1 || endIndex === -1) return [];

    return ALL_NOTES.slice(startIndex, endIndex + 1).map(note => ({
      note,
      type: note.includes('#') ? 'black' : 'white',
      pitch: note.replace(/[0-8]/, ''), 
      octave: note.slice(-1),
    }));
  }, [startNote, endNote]);

  const whiteKeyWidth = 50; 
  const blackKeyWidth = 30; 

  const getBlackKeyStyle = (index: number) => {
    
    // 計算這個黑鍵前面有多少個白鍵
    let whiteKeyCount = 0;
    for (let i = 0; i < index; i++) {
      if (!keys[i].note.includes('#')) {
        whiteKeyCount++;
      }
    }
    
    const leftPosition = whiteKeyCount * whiteKeyWidth - (blackKeyWidth / 2);

    return {
      left: `${leftPosition}px`
    };
  };

  const playNote = useCallback((note: string, velocity: number, type: 'white' | 'black') => {
    Tone.start(); 
    pianoSampler.triggerAttackRelease(note, "2n", Tone.now(), velocity);
    
    if (onKeyClick) { onKeyClick(note, type);}
  }, [onKeyClick]);

  return (
    <div className="piano-container">
      {keys.map(({ note, type, pitch, octave }, index) => (
        <button
          key={note}
          className={`piano-key ${type}-key`}
          style={type === 'black' ? getBlackKeyStyle(index) : {}}
          onMouseDown={() => playNote(note, 0.8, type as 'white' | 'black')} 
        >
          {type === 'white' && showWhiteKeyPitchNames && (
            <span className="key-label white-label">{pitch.replace('#', '')}{showOctaveNumbers && <span className="octave-number">{octave}</span>}</span>
          )}
          {type === 'black' && showBlackKeyPitchNames && (
            <span className="key-label black-label">{pitch}{showOctaveNumbers && <span className="octave-number">{octave}</span>}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default PianoKeyboard;