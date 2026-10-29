import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './AccidentalsStyles.css';

const Page1 = () => {
  const [activeAcc, setActiveAcc] = useState<string | null>(null);
  const [displayNote, setDisplayNote] = useState('C');

  const [isLoaded, setIsLoaded] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: {
        A3: "A3.mp3", 
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();

    Tone.loaded().then(() => {
      setIsLoaded(true);
      console.log('鋼琴音源載入完成');
    });

    return () => {
      samplerRef.current?.dispose();
    };
  }, []);

  const handleAccidentalClick = async (accidental: string) => {
    await Tone.start();
    if (!isLoaded || !samplerRef.current) return;
    setActiveAcc(accidental);
    
    let pitchToPlay = 'C4';
    let textToShow = 'C';

    if (accidental === '#') {
      pitchToPlay = 'C#4';
      textToShow = 'C#';
    } else if (accidental === 'b') {
      pitchToPlay = 'B3'; // C 降半音是 B
      textToShow = 'C♭';
    } else if (accidental === 'bb') {
      pitchToPlay = 'Bb3'; // C 降全音是 Bb (音高同 Cbb)
      textToShow = 'C𝄫';
    } else if (accidental === 'natural') {
      pitchToPlay = 'C4';
      textToShow = 'C♮';
    }

    setDisplayNote(textToShow);
    samplerRef.current.triggerAttackRelease(pitchToPlay, '2n');
  };

  return (
    <div className="page-content">
      <p>升/降記號是音樂中用來「調整音高」的變音記號，分別以 #（升記號 Sharp）和 ♭（降記號 Flat）來表示，𝄫 則是雙降記號，♮ 是還原記號。</p>
      
      <div className="accidental-showcase">
        <div className="base-note-box">
          {displayNote}
        </div>
        
        <div className="accidental-buttons">
          <button 
            className={`acc-btn ${activeAcc === '#' ? 'active' : ''}`}
            onClick={() => handleAccidentalClick('#')}
            disabled={!isLoaded}
          >♯</button>
          <button 
            className={`acc-btn ${activeAcc === 'b' ? 'active' : ''}`}
            onClick={() => handleAccidentalClick('b')}
            disabled={!isLoaded}
          >♭</button>
          <button 
            className={`acc-btn ${activeAcc === 'bb' ? 'active' : ''}`}
            onClick={() => handleAccidentalClick('bb')}
            disabled={!isLoaded}
          >𝄫</button>
          <button 
            className={`acc-btn ${activeAcc === 'natural' ? 'active' : ''}`}
            onClick={() => handleAccidentalClick('natural')}
            disabled={!isLoaded}
          >♮</button>
        </div>
      </div>

      <p className="instruction-text">點擊升/降記號，查看音名加上記號的樣子，並聆聽聲音</p>
    </div>
  );
};

export default Page1;