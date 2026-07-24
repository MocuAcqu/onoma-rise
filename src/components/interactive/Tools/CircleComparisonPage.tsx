import CircleComparison from './CircleComparison';

type CircleComparisonPageProps = { focus: 'chromatic' | 'fifths' };

export default function CircleComparisonPage({ focus }: CircleComparisonPageProps) {
  const isChromatic = focus === 'chromatic';
  return (
    <div className="tools-page-intro tools-page-intro--comparison">
      <span className="tools-kicker">兩種排列方式</span>
      <h2>半音圈與五度圈有何不同？</h2>
      <p className="page-content">{isChromatic
        ? '半音圈依照實際音高逐格前進，因此適合觀察音與音之間最小的距離。'
        : '五度圈依照完全五度排列，因此相鄰位置代表關係最接近的調性。'}</p>
      <CircleComparison />
    </div>
  );
}
