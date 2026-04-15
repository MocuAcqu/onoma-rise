import InteractiveStaff from '../InteractiveStaff';

const staffNotes = [
  { pitch: 'C4', position: 1, pitchName: '', solfege: 'Do', numberNotation: '1',hasLedgerLine: true  },
  { pitch: 'D4', position: 1.5, pitchName: '', solfege: 'Re', numberNotation: '2' },
  { pitch: 'E4', position: 2, pitchName: '', solfege: 'Mi', numberNotation: '3' },
  { pitch: 'F4', position: 2.5, pitchName: '', solfege: 'Fa', numberNotation: '4' },
  { pitch: 'G4', position: 3, pitchName: '', solfege: 'Sol', numberNotation: '5' },
  { pitch: 'A4', position: 3.5, pitchName: '', solfege: 'La', numberNotation: '6' },
  { pitch: 'B4', position: 4, pitchName: '', solfege: 'Si', numberNotation: '7' },
  { pitch: 'C5', position: 4.5, pitchName: '', solfege: 'Do', numberNotation: '1', isHighOctave: true },
  { pitch: 'D5', position: 5, pitchName: '', solfege: 'Re', numberNotation: '2', isHighOctave: true },
  { pitch: 'E5', position: 5.5, pitchName: '', solfege: 'Mi', numberNotation: '3', isHighOctave: true },
];

const SolfegePage2 = () => {
  return (
    <div className="page-content">
      <p>唱名對應五線譜的位置 (以C大調為例)，與其對應之唱名(Do、Re、Mi...)和簡譜。</p>
      <InteractiveStaff notes={staffNotes}/>
      <p className="instruction-text">點擊音符彈奏聲音</p>
    </div>
  );
};

export default SolfegePage2;