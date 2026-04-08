import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';

const NOTES_IN_RANGE = [
  'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 
  'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5'
];

const LABEL_NOTES = ['F3', 'C4', 'G4', 'C5', 'E5'];

// 計算每個音符的頻率
const noteToFreq = (note: string) => Tone.Frequency(note).toFrequency();

const Page4 = () => {
  const [freq, setFreq] = useState(noteToFreq('C4'));
  const [isMuted, setIsMuted] = useState(true); 
  const osc = useRef<Tone.Oscillator | null>(null);

  useEffect(() => {
    osc.current = new Tone.Oscillator(freq, "sine").toDestination();
    osc.current.volume.value = isMuted ? -Infinity : 0;
    osc.current.start();
    return () => { osc.current?.stop().dispose();};
  }, []); 

  useEffect(() => {
    if (osc.current) { osc.current.volume.value = isMuted ? -Infinity : 0; }
  }, [isMuted]);

  const sliderConfig = useMemo(() => {
    const freqs = NOTES_IN_RANGE.map(noteToFreq);
    return { min: Math.min(...freqs), max: Math.max(...freqs), steps: freqs };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFreq = parseFloat(e.target.value);
    setFreq(newFreq);
    if (osc.current) { osc.current.frequency.rampTo(newFreq, 0.05); }
  };
  
  // 當放開滑鼠時，吸附到最近的音符
  const snapToNearestNote = () => {
    let closestFreq = sliderConfig.steps[0];
    let smallestDiff = Math.abs(freq - closestFreq);
    
    sliderConfig.steps.forEach(stepFreq => {
      const diff = Math.abs(freq - stepFreq);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestFreq = stepFreq;
      }
    });
    
    setFreq(closestFreq);
     if (osc.current) {
      osc.current.frequency.rampTo(closestFreq, 0.1);
    }
  };

  const getLabelPosition = (note: string) => {
    const noteFreq = noteToFreq(note);
    const minFreq = sliderConfig.min;
    const maxFreq = sliderConfig.max;
    
    const percentage = ((noteFreq - minFreq) / (maxFreq - minFreq)) * 98;
    
    return `${percentage}%`;
  };

  const progress = ((freq - sliderConfig.min) / (sliderConfig.max - sliderConfig.min)) * 98;

  return (
    <div className="page-content">
      <p>聲音在物理上是由頻率決定的振動，而音名是把連續的聲音頻率分成不同音高類別的命名系統，因此音名就是把連續的頻率區間分類成幾個「音高類別」。</p>
      
      <div className="freq-container">
        <div className="freq-display-wrapper">
          <span className="freq-value">{freq.toFixed(2)} Hz</span>
          <button onClick={() => setIsMuted(!isMuted)} className="mute-btn">
            {isMuted ? <FiVolumeX /> : <FiVolume2 />}
          </button>
        </div>

        <div className="slider-container">
          <input 
            type="range" 
            min={sliderConfig.min} 
            max={sliderConfig.max} 
            step="0.01"
            value={freq}
            onChange={handleSliderChange}
            onMouseUp={snapToNearestNote}
            onTouchEnd={snapToNearestNote}
            className="freq-slider"
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          />
          <div className="slider-labels">
            {LABEL_NOTES.map(note => (
              <span 
                key={note}
                style={{ left: getLabelPosition(note)  }}
                className="slider-label-item"
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <p className="instruction-text">左右拉動滑桿，感受頻率與音高的連續變化</p>
    </div>
  );
};

export default Page4;