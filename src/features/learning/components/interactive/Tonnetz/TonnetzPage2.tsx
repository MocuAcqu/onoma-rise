import { useState } from 'react';
import TonnetzGrid from './TonnetzGrid';
import './Tonnetz.css';

const TRANSFORM_DATA = {
  P: {
    title: "Parallel 平行轉換",
    desc: "大和弦與同名小和弦的轉換（如 C ↔ Cm）。這兩個和弦共用「完全五度」的水平邊進行翻轉。",
    example: "同名大小調 C ↔ Cm",
    mode: "P" as const,
    image: "/assets/tonnetz/p_transform.png" 
  },
  L: {
    title: "Leittonwechsel 導音轉換",
    desc: "透過移動半音（小二度）來改變和弦（如 C ↔ Em）。這兩個和弦藉由共用「小三度」的邊翻轉。",
    example: "C 大調 ↔ Em 小調",
    mode: "L" as const,
    image: "/assets/tonnetz/l_transform.png" 
  },
  R: {
    title: "Relative 關係轉換",
    desc: "大小調的關係轉換（如 C ↔ Am）。這兩個和弦藉由共用「大三度」的邊來翻轉。",
    example: "C 大調 ↔ Am 小調",
    mode: "R" as const,
    image: "/assets/tonnetz/r_transform.png" 
  },
  N: {
    title: "Nebenverwandt 鄰關係",
    desc: "進行 (P+L+R) 的連續轉換，會共用一個音，其三角形落在共同音的對面。",
    example: "Am 小和弦 ↔ E 大和弦",
    mode: "N" as const,
    image: "/assets/tonnetz/n_transform.png" 
  }
};

const TonnetzPage2 = () => {
  const [currentTransform, setCurrentTransform] = useState<keyof typeof TRANSFORM_DATA>('P');

  const data = TRANSFORM_DATA[currentTransform];

  return (
    <div className="tonnetz-container">
      <p className="page-content">新里曼理論的   P、L、R、N  概念可以在調性網路上完美呈現。</p>
      
      <div className="tonnetz-interactive-area">
        <div className="custom-select-wrapper">
          <select 
            value={currentTransform} 
            onChange={(e) => setCurrentTransform(e.target.value as any)}
            className="tonnetz-select"
          >
            <option value="P">Parallel 平行轉換</option>
            <option value="L">Leittonwechsel 導音轉換</option>
            <option value="R">Relative 關係轉換</option>
            <option value="N">Nebenverwandt 鄰關係</option>
          </select>
        </div>

        <div className="transform-detail-display">
          <div className="transform-info-text">
            <h3>{data.title}</h3>
            <p className="page-content">{data.desc}</p>
            <div className="example-badge">範例：{data.example}</div>
          </div>
          
          <div className="transform-diagram-box">
            <img src={data.image} alt={data.title} className="transform-diagram-img" />
          </div>
        </div>

        <div className="grid-window">
          <TonnetzGrid 
            mode="face" 
            transformMode={data.mode} 
            interactive={true} 
            height="380px" 
          />
        </div>
      </div>

      <p className="instruction-text">點擊下選單查看 P、L、R、N 的關係，點擊網格聽聽看轉換間的聲響差異。</p>
    </div>
  );
};

export default TonnetzPage2;