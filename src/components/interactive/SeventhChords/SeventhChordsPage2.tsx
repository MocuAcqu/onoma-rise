import { useState } from 'react';
import * as Tone from 'tone';
import ChordStaff from '../ChordStaff';
import PianoKeyboard from '../PianoKeyboard';
import { getNoteY, generateChordNotes } from '../Triads/ChordUtils';
import '../Triads/Triads.css';

const SEVENTH_CHORD_TYPES = [
  { id: 'Major 7th', name: 'C 大七和弦 (Cmaj7)', notes: generateChordNotes('C', 'Major 7th', true) },
  { id: 'Minor 7th', name: 'C 小七和弦 (Cm7)', notes: generateChordNotes('C', 'Minor 7th', true) },
  { id: 'Dominant 7th', name: 'C 屬七和弦 (C7)', notes: generateChordNotes('C', 'Dominant 7th', true) },
  { id: 'Minor Major 7th', name: 'C 小大七和弦 (Cm(maj7))', notes: generateChordNotes('C', 'Minor Major 7th', true) },
  { id: 'Half Diminished 7th', name: 'C 半減七和弦 (Cø7)', notes: generateChordNotes('C', 'Half Diminished 7th', true) },
  { id: 'Diminished 7th', name: 'C 減七和弦 (Co7)', notes: generateChordNotes('C', 'Diminished 7th', true) },
  { id: 'Augmented 7th', name: 'C 增七和弦 (C+7)', notes: generateChordNotes('C', 'Augmented 7th', true) },
  { id: 'Augmented Major 7th', name: 'C 增大七和弦 (C+(maj7))', notes: generateChordNotes('C', 'Augmented Major 7th', true) },
];

const getIntervalLabels = (notes: string[]) => {
    const diff1 = Tone.Frequency(notes[1]).toMidi() - Tone.Frequency(notes[0]).toMidi();
    const diff2 = Tone.Frequency(notes[2]).toMidi() - Tone.Frequency(notes[1]).toMidi();
    const diff3 = Tone.Frequency(notes[3]).toMidi() - Tone.Frequency(notes[2]).toMidi();
    
    const intervalToText = (d: number) => d === 4 ? '大三度' : d === 3 ? '小三度' : d === 2 ? '大二度' : '未知';
    
    return [intervalToText(diff1), intervalToText(diff2), intervalToText(diff3)];
}

const SeventhChordsPage2 = () => {
  const [selectedId, setSelectedId] = useState('Major 7th');
  const chord = SEVENTH_CHORD_TYPES.find(c => c.id === selectedId)!;
  const intervals = getIntervalLabels(chord.notes);
  
  // 計算三個標籤的位置
  const y1 = (getNoteY(chord.notes[0]) + getNoteY(chord.notes[1])) / 2;
  const y2 = (getNoteY(chord.notes[1]) + getNoteY(chord.notes[2])) / 2;
  const y3 = (getNoteY(chord.notes[2]) + getNoteY(chord.notes[3])) / 2;

  const getTagColorClass = (text: string) => text === '小三度' ? 'pink-tag' : 'blue-tag';

  return (
    <div className="chord-container">
      <p className="page-content" style={{marginTop:'5%'}}>七和弦一共有「大七和弦、小七和弦、屬七和弦、小大七和弦、半減七和弦、減七和弦、增七和弦、增大七和弦」八種型態，是藉有「大/小/增/減三和弦」配對「大/小/減七度」來組成。</p>
      
      <select className="key-selector" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        {SEVENTH_CHORD_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      <div className="chord-comparison-layout">
        <div className="staff-with-labels">
          <ChordStaff notes={chord.notes} />
          
          <div className="dynamic-interval-labels">
            <div className={`interval-tag ${getTagColorClass(intervals[2])}`} style={{ bottom: `${y3 + 40}px` }}>{intervals[2]}</div>
            <div className={`interval-tag ${getTagColorClass(intervals[1])}`} style={{ bottom: `${y2 + 40}px` }}>{intervals[1]}</div>
            <div className={`interval-tag ${getTagColorClass(intervals[0])}`} style={{ bottom: `${y1 + 40}px` }}>{intervals[0]}</div>
          </div>
        </div>

        <PianoKeyboard startNote="C4" endNote="B4" highlightNotes={chord.notes} showWhiteKeyPitchNames showBlackKeyPitchNames />
      </div>
      <p className="instruction-text">點擊下選單查看不同和弦範例，點擊五線譜聆聽和弦聲音</p>
    </div>
  );
};

export default SeventhChordsPage2;