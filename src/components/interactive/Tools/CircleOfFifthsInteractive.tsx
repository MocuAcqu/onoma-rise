import MusicCircle from './MusicCircle';

export default function CircleOfFifthsInteractive() {
  return (
    <div className="tools-container"><div className="tools-interactive-area">
      <div className="tools-tool-header"><div><span className="tools-kicker">點選音名聆聽聲音</span><h2>五度圈的排列</h2></div></div>
      <p className="tools-description">沿著圓周前進，會依序看到 C → G → D → A。亮起的線段表示目前相鄰的完全五度關係。</p>
      <MusicCircle kind="fifths" />
    </div></div>
  );
}
