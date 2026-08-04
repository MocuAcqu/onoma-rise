export default function CircleOfFifthsPage1() {
  return (
    <div className="tools-page-intro">
      <span className="tools-kicker">第一步：認識排列</span>
      <h2>五度圈是什麼？</h2>
      <p className="page-content">五度圈也有十二個音，但排列方法不同：每前進一格都是完全五度，也就是七個半音。</p>
      <p className="page-content">從 C 開始，會依序走到 G、D、A。相鄰的位置代表調性之間的關係最接近。</p>
      <div className="tools-simple-flow" aria-label="五度圈順序範例"><span>C</span><b>→</b><span>G</span><b>→</b><span>D</span><b>→</b><span>A</span><em>……</em></div>
      <p className="tools-comparison-note">五度圈用來理解調號、和弦進行，以及轉調時的關係。</p>
    </div>
  );
}
