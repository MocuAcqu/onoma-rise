export default function SvgFilters() {
  return (
    <defs>
      <filter id="activeGlow" x="-300%" y="-300%" width="700%" height="700%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="recentGlow" x="-300%" y="-300%" width="700%" height="700%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
