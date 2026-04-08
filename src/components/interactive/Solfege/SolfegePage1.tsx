import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './SolfegeStyles.css';

const solfegeNotes = [
  { name: 'Do', file: 'do.mp3' },
  { name: 'Re', file: 're.mp3' },
  { name: 'Mi', file: 'mi.mp3' },
  { name: 'Fa', file: 'fa.mp3' },
  { name: 'Sol', file: 'sol.mp3' },
  { name: 'La', file: 'la.mp3' },
  { name: 'Si', file: 'si.mp3' },
];

const SolfegePage1 = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  // 使用 Players 來管理多個獨立音檔
  const playersRef = useRef<Tone.Players | null>(null);

  useEffect(() => {
    // 建立 Players 實例，對應每個音名和它的檔案路徑
    playersRef.current = new Tone.Players({
      Do: "/sounds/solfege/do.mp3",
      Re: "/sounds/solfege/re.mp3",
      Mi: "/sounds/solfege/mi.mp3",
      Fa: "/sounds/solfege/fa.mp3",
      Sol: "/sounds/solfege/sol.mp3",
      La: "/sounds/solfege/la.mp3",
      Si: "/sounds/solfege/si.mp3",
    }).toDestination();

    // 當所有音檔都載入完成後，更新狀態
    Tone.loaded().then(() => {
      setIsLoaded(true);
      console.log('人聲音檔載入完成');
    });

    return () => {
      playersRef.current?.dispose();
    };
  }, []);

  const playVoice = (noteName: string) => {
    // 確保已載入且沒有其他聲音正在播放 (可選)
    if (isLoaded && playersRef.current) {
      Tone.start();
      // 停止所有正在播放的聲音，避免重疊太吵
      playersRef.current.stopAll();
      // 播放指定的音檔
      playersRef.current.player(noteName).start();
    }
  };

  return (
    <div className="page-content">
      <p>唱名是用於演唱時方便唱譜使用，有助於演唱者區分音程。以 Do、Re、Mi、Fa、Sol、La、Si 七個字做為樂音。</p>
      
      <div className="solfege-buttons-container">
        {solfegeNotes.map(note => (
          <button 
            key={note.name} 
            className={`solfege-button ${!isLoaded ? 'loading' : ''}`}
            onClick={() => playVoice(note.name)}
            disabled={!isLoaded} // 載入完成前禁用按鈕
          >
            {note.name}
          </button>
        ))}
      </div>

      <p className="instruction-text">
        {isLoaded ? "點擊聆聽對應發音" : "音檔載入中..."}
      </p>
    </div>
  );
};

export default SolfegePage1;