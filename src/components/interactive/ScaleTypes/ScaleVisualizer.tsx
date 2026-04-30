import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { generateScale, generatePianoKeys} from './ScaleUtils';
import './ScaleDefinition.css';

type Props = {
  formula: number[];
  scaleName: string;
  allowDirection?: boolean;
  isMinor?: boolean; 
};

const ROOT_OPTIONS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const MINOR_OPTIMAL_ROOTS: Record<string, string> = {
  'Db': 'C#', 
  'Eb': 'D#',  
  'Gb': 'F#',  
  'Ab': 'G#', 
};

const ScaleVisualizer: React.FC<Props> = ({ formula, scaleName, isMinor = false, allowDirection = false }) => {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const sampler = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    sampler.current = new Tone.Sampler({
      urls: { C4: "C4.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    
    Tone.loaded().then(() => setIsLoaded(true));
    return () => {sampler.current?.dispose()};
  }, []);

  const currentScale = useMemo(() => {
    let rootForCalculation = selectedRoot;
    
    if (isMinor && MINOR_OPTIMAL_ROOTS[selectedRoot]) {
      rootForCalculation = MINOR_OPTIMAL_ROOTS[selectedRoot];
    }

    const scaleData = generateScale(rootForCalculation, formula, isMinor);
    return direction === 'down' ? [...scaleData].reverse() : scaleData;
  }, [selectedRoot, formula, direction, isMinor]);

  const pianoViewKeys = useMemo(() => {
    const sortedScale = [...currentScale].sort((a, b) => {
      return Tone.Frequency(a.fullPitch).toMidi() - Tone.Frequency(b.fullPitch).toMidi();
    });

    const firstNotePitch = sortedScale[0].fullPitch;

    const firstMidi = Tone.Frequency(firstNotePitch).toFrequency() > 0 
                      ? Tone.Frequency(firstNotePitch).toMidi() 
                      : 60; 

    const startingCMidi = Math.floor(firstMidi / 12) * 12;

    const lastNotePitch = sortedScale[sortedScale.length - 1].fullPitch;
    const lastMidi = Tone.Frequency(lastNotePitch).toMidi();
    
    let keysNeeded = (lastMidi - startingCMidi) + 1;
    keysNeeded = Math.max(keysNeeded, 24); 

    const remainder = keysNeeded % 12;
    if (remainder !== 0) {
      keysNeeded += (12 - remainder);
    }

    return generatePianoKeys(startingCMidi, keysNeeded);
  }, [currentScale]);

  const playNote = async (fullPitch: string, index: number) => {
    await Tone.start();
    if (!isLoaded || !sampler.current) return;

    sampler.current.triggerAttackRelease(fullPitch, "2n");
    
    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 300);
  };

  const actualRootName = isMinor && MINOR_OPTIMAL_ROOTS[selectedRoot] ? MINOR_OPTIMAL_ROOTS[selectedRoot] : selectedRoot;

  return (
    <div className="scale-visualizer-container">
      
      <div className="piano-indicator-row">
        <span className="row-label">鋼琴位置</span>
        <div className="piano-dots-grid">
          {pianoViewKeys.map((keyObj, index) => {
            const isBlackKey = keyObj.pitchName.includes('#');
            const isIncluded = currentScale.some(
              scaleNote => scaleNote.fullPitch === keyObj.fullPitch
            );

            const isBKey = keyObj.pitchName === 'B';

            return (
              <div 
                key={`${keyObj.fullPitch}-${index}`} 
                className={`piano-dot-cell ${isBlackKey ? 'black-bg' : 'white-bg'}`}
                style={{ borderRight: isBKey ? '3px solid #555' : '1px solid #ccc' }}
              >
                {isIncluded && <div className="active-dot"></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="root-selector-row">
        <span className="row-label">主音鍵</span>
        <div className="root-buttons-grid">
          {ROOT_OPTIONS.map(root => (
            <button 
              key={root}
              className={`root-btn ${selectedRoot === root ? 'active' : ''}`}
              onClick={() => setSelectedRoot(root)}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {allowDirection && (
        <div className="direction-controls">
          <label>
            <input type="radio" checked={direction === 'up'} onChange={() => setDirection('up')} /> 上行
          </label>
          <label>
            <input type="radio" checked={direction === 'down'} onChange={() => setDirection('down')} /> 下行
          </label>
        </div>
      )}

      <div className="scale-notes-row">
        <span className="row-label">對應音階</span>
        <div className="scale-blocks-grid">
          {currentScale.map((noteObj, index) => (
            <div 
              key={`${noteObj.fullPitch}-${index}`} 
              className={`scale-block ${activeIndex === index ? 'active' : ''}`}
              onClick={() => playNote(noteObj.fullPitch, index)}
            >
              <span className="block-note-name">
                {noteObj.noteName}
                <span style={{ fontSize: '0.6em', verticalAlign: 'baseline' }}>
                  {noteObj.octave}
                </span>
              </span>
              <span className="block-degree-num">
                {direction === 'up' ? index + 1 : currentScale.length - index}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="current-status-label">
        {actualRootName} {scaleName} {direction === 'down' ? '(下行)' : ''}
      </div>

    </div>
  );
};

export default ScaleVisualizer;