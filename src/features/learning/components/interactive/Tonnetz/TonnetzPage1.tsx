import { useState } from 'react';
import TonnetzGrid from './TonnetzGrid';
import './Tonnetz.css';

const TonnetzPage1 = () => {
  const [viewMode, setViewMode] = useState<'point' | 'line' | 'face'>('point');

  return (
    <div className="tonnetz-container">
      <p className="page-content">
        調性網路(Tonnetz) 是將和弦、音階的樂理概念，利用視覺空間幾何的方式，以一個無限延伸的二維「三角網格」來呈現。
      </p>

      <div className="tonnetz-interactive-area">

        <div className="custom-select-wrapper">
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as any)}
            className="tonnetz-select"
          >
            <option value="point">點: 單一音符</option>
            <option value="line">線: 音程關係</option>
            <option value="face">面: 三和弦</option>
          </select>
        </div>

        <div className="mode-description">
          {viewMode === 'point' && (
            <p className="page-content2">每一個圓圈交叉點，都代表一個單一的音符，用以精確標示半音階的位置。</p>
          )}
          {viewMode === 'line' && (
            <p className="page-content2">
                水平線（—）： 代表完全五度，相鄰的音符就是五度關係。
                <br />
                右上斜線（/）： 代表大三度，斜線上連接的音符，彼此相差四個半音。
                <br />
                左上斜線（\）： 代表小三度，斜線上連接的音符，彼此相差三個半音。
            </p>
          )}
          {viewMode === 'face' && (
            <p className="page-content2">
                因為一個標準的三和弦正好是由根音、三音、五音組成，所以在這個網格上每一個三角形，就代表一個和弦。紅色三角形：代表「大調和弦」（Major）；藍色三角形：代表「小調和弦」（minor）。
            </p>
          )}
        </div>

        <div className="grid-window">
           <TonnetzGrid mode={viewMode} interactive={true} height="350px" />
        </div>
      </div>

      <p className="instruction-text">點擊下選單查看調性網路網格點、線、面關係。可滑鼠拖曳網格平移。</p>
    </div>
  );
};

export default TonnetzPage1;