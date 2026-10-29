const rows = [
  ['每次差 1 半音', '每次差完全五度（7 半音）'],
  ['C → C# → D → D#', 'C → G → D → A'],
  ['用來研究音程', '用來研究調性'],
  ['十二平均律', '調號、和弦、轉調'],
  ['每個音都一樣重要', '相鄰的調彼此最接近'],
];

export default function CircleComparison() {
  return (
    <div className="circle-comparison" role="region" aria-label="半音圈與五度圈比較">
      <div className="circle-comparison__head"><strong>半音圈</strong><strong>五度圈</strong></div>
      {rows.map(([chromatic, fifths]) => (
        <div className="circle-comparison__row" key={chromatic}>
          <span data-label="半音圈">{chromatic}</span>
          <span data-label="五度圈">{fifths}</span>
        </div>
      ))}
    </div>
  );
}
