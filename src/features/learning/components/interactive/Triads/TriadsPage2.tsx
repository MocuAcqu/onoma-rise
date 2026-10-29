import { useState } from 'react';
import ChordStaff from '../ChordStaff';
import PianoKeyboard from '../PianoKeyboard';
import { getNoteY } from './ChordUtils';
import './Triads.css';

const TRIAD_TYPES = [
  { id: 'Major', name: 'C 大三和弦', notes: ['C4', 'E4', 'G4'], intervals: ['小三度', '大三度'] },
  { id: 'Minor', name: 'C 小三和弦', notes: ['C4', 'Eb4', 'G4'], intervals: ['大三度', '小三度'] },
  { id: 'Augmented', name: 'C 增三和弦', notes: ['C4', 'E4', 'G#4'], intervals: ['大三度', '大三度'] },
  { id: 'Diminished', name: 'C 減三和弦', notes: ['C4', 'Eb4', 'Gb4'], intervals: ['小三度', '小三度'] },
];

const TriadsPage2 = () => {
  const [selectedId, setSelectedId] = useState('Major');
  const chord = TRIAD_TYPES.find(c => c.id === selectedId)!;

  const bottomLabelY = (getNoteY(chord.notes[0]) + getNoteY(chord.notes[1])) / 2;
  const topLabelY = (getNoteY(chord.notes[1]) + getNoteY(chord.notes[2])) / 2;

  const getTagColorClass = (intervalText: string) => {
    return intervalText === '小三度' ? 'pink-tag' : 'blue-tag';
  };

  return (
    <div className="chord-container">
      <p className="page-content" style={{marginTop:'5%'}}>三和弦一共有「大、小、增、減」四種型態，主要受到兩個音之間的三度關係，因此會用升降記號來改變三和弦的形態。</p>
      
      <select className="key-selector" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        {TRIAD_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      <div className="chord-comparison-layout">
        <div className="staff-with-labels">
          <ChordStaff notes={chord.notes} />
          
          <div className="dynamic-interval-labels">
            <div 
              className={`interval-tag ${getTagColorClass(chord.intervals[1])}`} 
              style={{ bottom: `${topLabelY + 40}px` }}
            >
              {chord.intervals[1]}
            </div>
            <div 
              className={`interval-tag ${getTagColorClass(chord.intervals[0])}`} 
              style={{ bottom: `${bottomLabelY + 40}px` }}
            >
              {chord.intervals[0]}
            </div>
          </div>
        </div>

        <PianoKeyboard startNote="C4" endNote="B4" highlightNotes={chord.notes} showWhiteKeyPitchNames showBlackKeyPitchNames />
      </div>
      <p className="instruction-text">點擊下選單查看不同和弦範例，點擊五線譜聆聽和弦聲音</p>
    </div>
  );
};

export default TriadsPage2;