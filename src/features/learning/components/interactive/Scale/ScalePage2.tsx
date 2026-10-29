import { useState } from 'react';
import InteractiveStaff from '../InteractiveStaff';
import { cMajorScaleNotes } from './ScaleData';
import './ScaleDefinition.css'; 

const ScalePage2 = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleNoteClick = (note: any) => {
    const index = cMajorScaleNotes.findIndex(n => n.pitch === note.pitch);
    setActiveIndex(index);
  };

  return (
    <div className="page-content">
      <p>在音階的七個音當中，每個音都有屬於自己的音級名稱，且排列順序不論大小調都相同。</p>
      
      <div className="scale-degrees-layout">
        <div className="staff-section">
          <InteractiveStaff 
            notes={cMajorScaleNotes.map(({pitchName, degreeName, ...rest}) => rest)} 
            onKeyClick={handleNoteClick}
          />
        </div>

        <div className="degrees-list-card">
          {cMajorScaleNotes.map((note, index) => (
            <div 
              key={note.pitch} 
              className={`degree-item ${activeIndex === index ? 'active' : ''}`}
            >
              {note.degreeName}
            </div>
          ))}
        </div>
      </div>

      <p className="instruction-text">點擊音符，查看對應音級名稱</p>
    </div>
  );
};

export default ScalePage2;