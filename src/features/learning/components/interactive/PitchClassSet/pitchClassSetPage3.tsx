import PianoKeyboard from '../PianoKeyboard';

const PitchClassSetPage3 = () => (
  <div className="pitch-set-container">
      <p className="page-content" style={{marginTop:'5%'}}>
        為了更準確知道鋼琴鍵上特定的音，因此將開頭兩個的 A、B 音稱為 A0, B0，後續每高八度的音就會往上加一個數字。
      </p>
    <div className="scroll-piano-container">
      {/* 渲染全部 88 鍵 (A0 到 C8) */}
      <div style={{ width: '2600px' }}> {/* 給予足夠的寬度以防擠壓 */}
        <PianoKeyboard 
          startNote="A0" 
          endNote="C8" 
          showWhiteKeyPitchNames={true} 
          showBlackKeyPitchNames={true}
          showOctaveNumbers={true} 
        />
      </div>
    </div>
    <p className="instruction-text">請左右滑動滑桿，可點擊琴鍵聆聽聲音</p>
  </div>
);
export default PitchClassSetPage3;