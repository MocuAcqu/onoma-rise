import { useState } from 'react';
import ScaleVisualizer from './ScaleVisualizer';
import { SCALE_FORMULAS } from './ScaleUtils';
import InteractiveStaff from '../InteractiveStaff'; 
import './ScaleDefinition.css';

export const TypePage1 = () => (
  <div className="page-content">
    <p>大調音階（Major scales）音程關係是：全—全—半—全—全—全—半。</p>
    <ScaleVisualizer formula={SCALE_FORMULAS.major} scaleName="大調音階" />
    <p className="instruction-text">點擊主音鍵，查看不同音階組合，並點擊下方音塊聆聽</p>
  </div>
);

export const TypePage2 = () => (
  <div className="page-content">
    <p>自然小音階（Natural minor）音程關係是：全－半－全－全－半－全－全。</p>
    <ScaleVisualizer 
      formula={SCALE_FORMULAS.naturalMinor} 
      scaleName="自然小音階" 
      isMinor={true} 
    />
    <p className="instruction-text">點擊主音鍵，查看不同音階組合，並點擊下方音塊聆聽</p>
  </div>
);

export const TypePage3 = () => (
  <div className="page-content">
    <p>和聲小音階（Harmonic minor）音程關係是：全－半－全－全－半－增二度音－半。</p>
    <ScaleVisualizer 
      formula={SCALE_FORMULAS.harmonicMinor} 
      scaleName="和聲小音階" 
      isMinor={true} 
    />
    <p className="instruction-text">點擊主音鍵，查看不同音階組合，並點擊下方音塊聆聽</p>
  </div>
);

export const TypePage4 = () => (
  <div className="page-content">
    <p>旋律(曲調)小音階（Melodic minor）音程關係是：全－半－全－全－全－全－半。</p>
    <ScaleVisualizer 
      formula={SCALE_FORMULAS.melodicMinor} 
      scaleName="旋律小音階" 
      isMinor={true} 
    />
    <p className="instruction-text">點擊主音鍵，查看不同音階組合，並點擊下方音塊聆聽</p>
  </div>
);

export const TypePage5 = () => (
  <div className="page-content">
    <p>半音音階（Chromatic scales）每個音之間的音程都是半音。</p>
    <ScaleVisualizer 
      formula={SCALE_FORMULAS.chromatic} 
      scaleName="半音音階" 
      allowDirection={true}
    />
    <p className="instruction-text">點擊主音鍵，查看不同音階組合，並點擊下方音塊聆聽</p>
  </div>
);

export const TypePage6 = () => (
  <div className="page-content">
    <p>全音音階（Whole Tone scales）每個音之間的音程都是全音。</p>
    <ScaleVisualizer 
      formula={SCALE_FORMULAS.wholeTone} 
      scaleName="全音音階" 
      allowDirection={true}
    />
    <p className="instruction-text">點擊主音鍵，查看不同音階組合，並點擊下方音塊聆聽</p>
  </div>
);

export const TypePage7 = () => {
  const pentatonicNotes = [
    { pitch: 'C4', position: 1, solfege: 'Do', numberNotation: '1st', hasLedgerLine: true, degreeName: '第一個音：主音' },
    { pitch: 'D4', position: 1.5, solfege: 'Re', numberNotation: '2nd', degreeName: '第二個音：上主音' },
    { pitch: 'E4', position: 2, solfege: 'Mi', numberNotation: '3rd', degreeName: '第三個音：中音' },
    { pitch: 'F4', position: 2.5, solfege: 'Fa', numberNotation: '4th', degreeName: '第四個音：屬音' },
    { pitch: 'G4', position: 3, solfege: 'Sol', numberNotation: '5th', degreeName: '第五個音：下中音' },
  ];
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="page-content">
      <p>五聲音階（Pentatonic scales）在大調五聲音階裡的五個音分別是：主音、上主音、中音、屬音與下中音，也就是五個音組合而成的音階。</p>
      
      <div className="scale-degrees-layout5">
        <div className="staff-section">
          <InteractiveStaff 
            notes={pentatonicNotes} 
            onKeyClick={(note) => {
              const index = pentatonicNotes.findIndex(n => n.pitch === note.pitch);
              setActiveIndex(index);
            }}
          />
        </div>

        <div className="degrees-list-card">
          {pentatonicNotes.map((note, index) => (
            <div key={note.pitch} className={`degree-item ${activeIndex === index ? 'active' : ''}`}>
              {note.degreeName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};