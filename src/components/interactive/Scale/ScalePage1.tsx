import InteractiveStaff from '../InteractiveStaff';
import { cMajorScaleNotes } from './ScaleData';

const ScalePage1 = () => (
  <div className="page-content">
    <p>音階 (Scale) 是指從主音開始，按照順序由低到高、或由高到低排列的一組音符，通常以一個八度排列 (七個音)。</p>
    <InteractiveStaff notes={cMajorScaleNotes.map(({numberNotation, degreeName, ...rest}) => rest)} />
    <p className="instruction-text">點擊音符，聆聽聲音</p>
  </div>
);

export default ScalePage1;