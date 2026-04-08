import PianoKeyboard from '../PianoKeyboard';

const Page1 = () => (
  <div className="page-content">
    <p>音名 (pitch name), 用 C (Do)、D(Re)、E(Mi)、F(Fa)、G(Sol)、A(La)、B(Si) 七個英文字母表示固定音高的名稱, 在鋼琴鍵盤上對應固定位置。</p>
    <PianoKeyboard startNote="C4" endNote="B4" showWhiteKeyPitchNames={true} showBlackKeyPitchNames={false}  />
    <p className="instruction-text">點擊琴鍵彈奏聲音</p>
  </div>
);
export default Page1;