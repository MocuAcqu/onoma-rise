import MusicCircle from './MusicCircle';

export default function ChromaticCircleInteractive() {
  return (
    <div className="tools-container"><div className="tools-interactive-area">
      <div className="tools-tool-header"><div><span className="tools-kicker">點選音名聆聽聲音</span><h2>半音圈的排列</h2></div></div>
      <p className="tools-description">沿著圓周前進，會依序看到 C → C# → D → D#。亮起的線段表示目前相鄰的一個半音。</p>
      <MusicCircle kind="chromatic" />
    </div></div>
  );
}
