export default function CircleOfFifthsPage1() {
  return (
    <div className="tools-page-intro fifths-intro">
      <span className="tools-kicker">認識五度圈</span>
      <h2>五度圈的三層結構</h2>
      <p className="page-content">五度圈把十二個調依完全五度排成一圈。從 C 順時針走，依序是 G、D、A；每前進一格都相差七個半音。</p>
      <div className="fifths-intro__layers">
        <article><span className="fifths-intro__swatch fifths-intro__swatch--signature" /> <div><strong>外圈：調號</strong><p>顯示這個調有幾個升記號或降記號。</p></div></article>
        <article><span className="fifths-intro__swatch fifths-intro__swatch--major" /> <div><strong>中圈：大調</strong><p>顯示十二個大調的排列位置。</p></div></article>
        <article><span className="fifths-intro__swatch fifths-intro__swatch--minor" /> <div><strong>內圈：關係小調</strong><p>與外面大調共用相同調號的小調。</p></div></article>
      </div>
      <p className="tools-comparison-note">例如 C 大調與 A 小調都沒有升降記號，因此位在同一個扇形區域。</p>
    </div>
  );
}
