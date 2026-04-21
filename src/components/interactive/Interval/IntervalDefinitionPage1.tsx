import { useState, useRef } from 'react';
import * as Tone from 'tone';
import { calculateInterval } from './IntervalUtils';
import './IntervalDefinition.css';

const NOTES = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];

const IntervalPage1 = () => {
  const [selection, setSelection] = useState<string[]>(['C4', 'C#4']);
  const sampler = useRef(new Tone.Sampler({
    urls: { C4: "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination());

  const handleKeyClick = async (note: string) => {
    await Tone.start();
    sampler.current.triggerAttackRelease(note, "4n");
    
    setSelection(prev => {
      const newSelection = [...prev, note];
      return newSelection.slice(-2); 
    });
  };

  const { lowNote, highNote, semitones } = calculateInterval(selection[0], selection[1]);

  return (
    <div className="interval-container">
      <p className="page-content">音程(interval) 是兩個音之間的距離，其中最小距離單位是「半音」，用以衡量音高距離，且一組音名的循環是由十二個半音所組成。</p>
      
      <div className="flat-keyboard">
        {NOTES.map(note => (
          <button 
            key={note}
            className={`flat-key ${note.includes('#') ? 'black' : 'white'} ${selection.includes(note) ? 'active' : ''}`}
            onClick={() => handleKeyClick(note)}
          >
            {note.replace('4', '')}
          </button>
        ))}
      </div>

      <div className="interval-result">
        <div className="result-note-box">{lowNote.replace('4', '')}</div>
        <div className="result-arrow">
          <span className="result-text">差 {semitones} 個半音</span>
          <div className="arrow-line"></div>
        </div>
        <div className="result-note-box">{highNote.replace('4', '')}</div>
      </div>
      <p className="instruction-text">點擊任意兩個琴鍵，計算相差幾個半音</p>
    </div>
  );
};
export default IntervalPage1;

