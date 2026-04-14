import { useState, useRef } from 'react';
import * as Tone from 'tone';
import AirMoleculeCanvas from '../AirMoleculeCanvas';
import { IoMusicalNote } from 'react-icons/io5';
import './SoundFormation.css';

const SoundFormationPage1 = () => {
  const [triggerTime, setTriggerTime] = useState(0);
  const sampler = useRef(new Tone.Sampler({
    urls: { C4: "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination());

  const handleCenterClick = async () => {
    await Tone.start(); // 啟動音訊
    setTriggerTime(performance.now()); // 更新時間，觸發 Canvas 波紋
    sampler.current.triggerAttackRelease("C4", "1n");
  };

  return (
    <div className="page-content formation-page">
      <p className="formation-desc">
        當樂器發出聲音時，它會擠壓周圍的空氣，形成由內向外擴散的震動波。
      </p>

      <div className="molecule-interactive-container">
        {/* 背景：分子畫布 */}
        <AirMoleculeCanvas triggerTime={triggerTime} />

        {/* 覆蓋在中央的按鈕 */}
        <button className="center-piano-btn" onClick={handleCenterClick}>
          <div className="btn-ripple"></div>
          <IoMusicalNote size={30} />
          <span>點擊發聲</span>
        </button>
      </div>

      <p className="instruction-text">點擊中央按鈕，觀察聲波如何向外擴散</p>
    </div>
  );
};
export default SoundFormationPage1;