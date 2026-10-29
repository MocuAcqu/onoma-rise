import { useState } from 'react';
import TonnetzGrid from './TonnetzGrid';
import './Tonnetz.css';

const CHORD_TYPE_DATA = {
  MAJOR: {
    title: "大和弦 (Major Triad)",
    desc: "大和弦由根音、大三度與完全五度組成。在調性網路上，它由一個「倒三角形」表示，結合了一條大三度邊與一條小三度邊。",
    formula: "大三度 + 小三度",
    highlightMode: "major" as const,
    image: "/assets/tonnetz/major_chord.png" 
  },
  MINOR: {
    title: "小和弦 (Minor Triad)",
    desc: "小和弦由根音、小三度與完全五度組成。在調性網路上，它由一個「正三角形」表示，同樣由大/小三度組成，但方向與大和弦相反。",
    formula: "小三度 + 大三度",
    highlightMode: "minor" as const,
    image: "/assets/tonnetz/minor_chord.png"
  },
  AUGMENTED: {
    title: "增和弦 (Augmented Triad)",
    desc: "增和弦由兩個大三度疊加而成。在網格上，因為「右下斜線」代表大三度，所以增和弦會沿著這個軸線連成一條「直線」，無法形成封閉的三角形。",
    formula: "大三度 + 大三度",
    highlightMode: "augmented" as const,
    image: "/assets/tonnetz/augmented_chord.png"
  },
  DIMINISHED: {
    title: "減和弦 (Diminished Triad)",
    desc: "減和弦由兩個小三度疊加而成。在網格上，因為「左下斜線」代表小三度，減和弦會沿著這個軸線連成一條相應方向的「直線」，無法形成封閉的三角形。",
    formula: "小三度 + 小三度",
    highlightMode: "diminished" as const,
    image: "/assets/tonnetz/diminished_chord.png"
  }
};

const TonnetzPage3 = () => {
  const [currentType, setCurrentType] = useState<keyof typeof CHORD_TYPE_DATA>('MAJOR');
  const data = CHORD_TYPE_DATA[currentType];

  return (
    <div className="tonnetz-container">
      <p className="page-content">三和弦又分成「大、小、增、減」四種類型，在調性網路上，倒三角形代表「大調和弦」，正三角形代表「小調和弦」，是以大/小三度去做組合。</p>
      
      <div className="tonnetz-interactive-area">
        <div className="custom-select-wrapper">
          <select 
            value={currentType} 
            onChange={(e) => setCurrentType(e.target.value as any)}
            className="tonnetz-select"
          >
            <option value="MAJOR">大和弦 (Major)</option>
            <option value="MINOR">小和弦 (Minor)</option>
            <option value="AUGMENTED">增和弦 (Augmented)</option>
            <option value="DIMINISHED">減和弦 (Diminished)</option>
          </select>
        </div>

        <div className="transform-detail-display">
          <div className="transform-info-text">
            <h3>{data.title}</h3>
            <p className="page-content">{data.desc}</p>
            <div className="example-badge">組合公式：{data.formula}</div>
          </div>
          
          <div className="transform-diagram-box">
            <img src={data.image} alt={data.title} className="transform-diagram-img" />
          </div>
        </div>

        <div className="grid-window">
          <TonnetzGrid 
            mode="face" 
            highlightChordType={data.highlightMode} 
            interactive={true} 
            height="350px" 
          />
        </div>
      </div>

      <p className="instruction-text">點擊下選單查看不同和弦類型的關係，觀察網格中的形狀變化。</p>
    </div>
  );
};

export default TonnetzPage3;