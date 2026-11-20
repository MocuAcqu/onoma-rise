// 每一列：[比較項目, 半音圈, 五度圈]
const rows = [
  ['間距', '每次差 1 半音', '每次差完全五度（7 半音）'],
  ['排列', 'C → C# → D → D#', 'C → G → D → A'],
  ['用途', '用來研究音程', '用來研究調性'],
  ['應用', '十二平均律', '調號、和弦、轉調'],
  ['特色', '每個音都一樣重要', '相鄰的調彼此最接近'],
];

const circles = [
  { name: '半音圈', modifier: 'chromatic', column: 1 },
  { name: '五度圈', modifier: 'fifths', column: 2 },
] as const;

export default function CircleComparison() {
  return (
    <>
      {/* 桌機／平板：左右對照表 */}
      <div className="circle-comparison" role="region" aria-label="半音圈與五度圈比較">
        <div className="circle-comparison__head"><strong>半音圈</strong><strong>五度圈</strong></div>
        {rows.map(([, chromatic, fifths]) => (
          <div className="circle-comparison__row" key={chromatic}>
            <span>{chromatic}</span>
            <span>{fifths}</span>
          </div>
        ))}
      </div>

      {/* 手機：兩種圈分開介紹，不必在兩欄之間來回對照 */}
      <div className="circle-comparison-cards" role="region" aria-label="半音圈與五度圈介紹">
        {circles.map(({ name, modifier, column }) => (
          <section key={name} className={`circle-comparison-card circle-comparison-card--${modifier}`}>
            <h3>{name}</h3>
            <dl>
              {rows.map((row) => (
                <div key={row[0]}>
                  <dt>{row[0]}</dt>
                  <dd>{row[column]}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
