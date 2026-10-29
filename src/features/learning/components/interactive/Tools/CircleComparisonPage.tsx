import CircleComparison from './CircleComparison';

type CircleComparisonPageProps = { focus: 'chromatic' | 'fifths' };

export default function CircleComparisonPage({ focus }: CircleComparisonPageProps) {
  if (focus === 'fifths') {
    return <div className="tools-page-intro fifths-reading-guide">
      <span className="tools-kicker">閱讀五度圈</span>
      <h2>怎麼閱讀這張五度圈？</h2>
      <div className="fifths-reading-guide__steps">
        <article><b>1</b><div><strong>先看中圈的大調</strong><p>從 C 開始，順時針是 G、D、A，表示每次往上完全五度。</p></div></article>
        <article><b>2</b><div><strong>再看外圈的調號</strong><p>順時針會多一個升記號；逆時針則多一個降記號。</p></div></article>
        <article><b>3</b><div><strong>最後找內圈的關係小調</strong><p>同一扇形裡的大調與小調共用調號，例如 G 大調與 E 小調。</p></div></article>
      </div>
      <p className="tools-comparison-note">圓上彼此相鄰的調最接近，常用於理解和弦進行與轉調。</p>
    </div>;
  }

  return <div className="tools-page-intro tools-page-intro--comparison">
    <span className="tools-kicker">兩種排列方式</span>
    <h2>半音圈與五度圈有何不同？</h2>
    <p className="page-content">半音圈依照實際音高逐格前進，因此適合觀察音與音之間最小的距離。</p>
    <p className="tools-comparison-note">閱讀表格時，先看「每次差多少」，再看它適合用來理解什麼。</p>
    <CircleComparison />
  </div>;
}
