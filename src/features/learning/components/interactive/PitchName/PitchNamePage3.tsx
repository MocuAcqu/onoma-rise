import InteractiveStaff from '../InteractiveStaff';

const cMajorScaleNotes = [
  { pitch: 'C4', position: 1, pitchName: 'C', solfege: 'Do', numberNotation: '', hasLedgerLine: true  },
  { pitch: 'D4', position: 1.5, pitchName: 'D', solfege: 'Re', numberNotation: '' },
  { pitch: 'E4', position: 2, pitchName: 'E', solfege: 'Mi', numberNotation: '' },
  { pitch: 'F4', position: 2.5, pitchName: 'F', solfege: 'Fa', numberNotation: '' },
  { pitch: 'G4', position: 3, pitchName: 'G', solfege: 'Sol', numberNotation: '' },
  { pitch: 'A4', position: 3.5, pitchName: 'A', solfege: 'La', numberNotation: '' },
  { pitch: 'B4', position: 4, pitchName: 'B', solfege: 'Si', numberNotation: '' },
];

const Page3 = () => (
  <div className="page-content">
    <p>音名對應五線譜的位置  (以C大調為例)，與其對應之唱名(Do、Re、Mi...)。</p>
    <InteractiveStaff notes={cMajorScaleNotes} />
    <p className="instruction-text">點擊音符彈奏聲音</p>
  </div>
);

export default Page3;