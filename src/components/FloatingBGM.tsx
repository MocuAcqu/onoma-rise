import { useState, useEffect, useRef } from 'react';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import './FloatingBGM.css';

const FloatingBGM = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const targetVolume = useRef(0.2); 
  const fadeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.15); 
  const [isHovered, setIsHovered] = useState(false);

  const fadeInAudio = async () => {
    if (!audioRef.current) return;

    audioRef.current.volume = 0;
    setVolume(0);

    await audioRef.current.play();
    setIsPlaying(true);

    if (fadeInterval.current) clearInterval(fadeInterval.current);

    const steps = 30;
    const stepTime = 100;
    const volumeStep = targetVolume.current / steps;

    fadeInterval.current = setInterval(() => {
        if (audioRef.current) {
        let nextVolume = audioRef.current.volume + volumeStep;

        if (nextVolume >= targetVolume.current) {
            nextVolume = targetVolume.current;
            if (fadeInterval.current) clearInterval(fadeInterval.current);
        }
            
        audioRef.current.volume = nextVolume;
            setVolume(nextVolume);
        }
    }, stepTime);
  };

  useEffect(() => {
    const handleStartBgm = () => {
      if (audioRef.current && audioRef.current.paused) {
        fadeInAudio();
      }
    };

    window.addEventListener('start-bgm', handleStartBgm);
    return () => {
      window.removeEventListener('start-bgm', handleStartBgm);
      if (fadeInterval.current) clearInterval(fadeInterval.current);
    };
  }, []);

   const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (fadeInterval.current) clearInterval(fadeInterval.current);
    
    const newVolume = parseFloat(e.target.value);
    targetVolume.current = newVolume;
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    if (newVolume > 0 && !isPlaying) {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (fadeInterval.current) clearInterval(fadeInterval.current);

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = targetVolume.current;
        setVolume(targetVolume.current);
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  return (
    <div 
      className="floating-bgm-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* HTML5 原生音訊播放器：串流播放，不吃記憶體 */}
      {/* preload="none"：在使用者點擊前不下載音檔，節省網路資源 */}
      <audio 
        ref={audioRef} 
        src="/sounds/bgm.mp3" 
        loop 
        preload="none" 
      />

      <div className={`bgm-slider-wrapper ${isHovered ? 'show' : ''}`}>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={handleVolumeChange}
          className="bgm-volume-slider"
          style={{ 
            background: `linear-gradient(to right, var(--color-sunset-pink) ${volume * 100}%, #e2e8f0 ${volume * 100}%)` 
        }}
        />
      </div>

      <button className={`bgm-toggle-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay}>
        {isPlaying && volume > 0 ? <FiVolume2 size={24} /> : <FiVolumeX size={24} />}
      </button>
    </div>
  );
};

export default FloatingBGM;