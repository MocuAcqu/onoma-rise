import CircleOfFifthsWheel from './CircleOfFifthsWheel';

export default function CircleOfFifthsInteractive() {
  return <div className="tools-container"><div className="tools-interactive-area">
    <div className="tools-tool-header"><div><span className="tools-kicker">點選音名聆聽聲音</span><h2>五度圈的調性結構</h2></div></div>
    <p className="tools-description">由內向外分別是關係小調、大調與調號。沿著中圈順時針移動，每一格都相差完全五度；相鄰調性也最接近。</p>
    <CircleOfFifthsWheel />
  </div></div>;
}
