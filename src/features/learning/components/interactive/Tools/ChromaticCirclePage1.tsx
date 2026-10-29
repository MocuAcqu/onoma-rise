import MusicCircle from './MusicCircle';

export default function ChromaticCirclePage1() {
  return <div className="tools-intro"><div className="tools-intro__copy">
    <span className="tools-kicker">十二平均律地圖</span><h2>半音圈是什麼？</h2>
    <p>把鋼琴上一個八度裡的十二個鍵攤開，再把頭尾接起來，就是半音圈。</p>
    <p>從 C、C#、D 一路走到 B，下一格會回到下一個八度的 C；音名重複，但音高會更高。</p>
    <p className="tools-intro__hint">點選音名，亮起的線會標示你剛走過的一個半音。</p>
  </div><MusicCircle kind="chromatic" compact /></div>;
}
