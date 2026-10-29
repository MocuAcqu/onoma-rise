import PianoKeyboard from '../PianoKeyboard';

const Page2 = () => (
  <div className="page-content">
    <p>音名就是一個八度中的七個音高設定之名稱, 表示該音的「絕對音高」, 每高或低八度的音名是一樣的，但對應的音高會不同，因此聲音相異。</p>
    <PianoKeyboard startNote="F3" endNote="E5" showWhiteKeyPitchNames={true} showBlackKeyPitchNames={false} showOctaveNumbers={true} />
    <p className="instruction-text">可點擊相同音名的琴鍵，比較差異</p>
  </div>
);
export default Page2;