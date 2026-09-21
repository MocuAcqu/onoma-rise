import type { EdgeAnimMap } from "../../hooks/useEdgeFrameAnimation";
import type { TransformMode } from "../../hooks/useTransformTransition";
import type { PitchClass, TonnetzNode } from "../../type";
import type { CoordinateMapper } from "./types";

const EDGE_KINDS = [
  { label: "fifth", dq: 1, dr: 0, activeColor: "#94B9FF", inactiveColor: "rgba(113,128,155,0.34)" },
  { label: "M3", dq: 0, dr: 1, activeColor: "#7ca8ff", inactiveColor: "rgba(113,128,155,0.28)" },
  { label: "m3", dq: -1, dr: 1, activeColor: "#E894FF", inactiveColor: "rgba(113,128,155,0.24)" },
] as const;

type Props = {
  nodes: TonnetzNode[];
  activeEdgeKey: string | null;
  activeEdgePitchPair: [PitchClass, PitchClass] | null;
  highlightedPitchClasses: Set<PitchClass>;
  selectedDiamondPitchSet: PitchClass[] | null;
  transformMode: TransformMode;
  edgeFrames: EdgeAnimMap;
  currentOctave: number;
  toX: CoordinateMapper;
  toY: CoordinateMapper;
  onClick: (
    from: PitchClass,
    to: PitchClass,
    fromIndex: number,
    toIndex: number,
    octave: number,
    key: string,
  ) => void;
};

export default function EdgeLayer({
  nodes,
  activeEdgeKey,
  activeEdgePitchPair,
  highlightedPitchClasses,
  selectedDiamondPitchSet,
  transformMode,
  edgeFrames,
  currentOctave,
  toX,
  toY,
  onClick,
}: Props) {
  const nodeIndexByKey = new Map<string, number>();
  nodes.forEach((node, index) => nodeIndexByKey.set(`${node.q},${node.r}`, index));

  return EDGE_KINDS.flatMap(({ label, dq, dr, activeColor, inactiveColor }) =>
    nodes.map((node, index) => {
      const neighborIndex = nodeIndexByKey.get(`${node.q + dq},${node.r + dr}`);
      if (neighborIndex === undefined) return null;
      const neighbor = nodes[neighborIndex];

      const key = `${label}-${node.q}-${node.r}`;
      const isPairMatch = activeEdgePitchPair !== null &&
        ((activeEdgePitchPair[0] === node.label && activeEdgePitchPair[1] === neighbor.label) ||
          (activeEdgePitchPair[1] === node.label && activeEdgePitchPair[0] === neighbor.label));
      const isTransformSharedEdge = transformMode !== "basic" &&
        selectedDiamondPitchSet !== null &&
        selectedDiamondPitchSet.includes(node.label) &&
        selectedDiamondPitchSet.includes(neighbor.label) &&
        ((transformMode === "P" && label === "fifth") ||
          (transformMode === "L" && label === "m3") ||
          (transformMode === "R" && label === "M3"));
      const isChordEdge = highlightedPitchClasses.has(node.label) &&
        highlightedPitchClasses.has(neighbor.label) &&
        !isTransformSharedEdge;
      const active = activeEdgeKey === key || isPairMatch || isChordEdge;
      const frame = edgeFrames[key];
      const x1 = toX(node.x);
      const y1 = toY(node.y);
      const x2 = toX(neighbor.x);
      const y2 = toY(neighbor.y);
      const progress = frame === 1 ? 0.2 : frame === 2 ? 0.45 : frame === 3 ? 0.7 : frame === 4 ? 0.9 : 0.25;
      const sweepX = x1 + (x2 - x1) * progress;
      const sweepY = y1 + (y2 - y1) * progress;
      const sweepWidth = frame === 1 ? 10 : frame === 2 ? 9 : frame === 3 ? 8 : frame === 4 ? 7 : 0;
      const sweepOpacity = frame === 1 ? 0.55 : frame === 2 ? 0.48 : frame === 3 ? 0.38 : frame === 4 ? 0.24 : 0;
      const interactive = transformMode === "basic";

      return (
        <g
          key={key}
          style={{ cursor: interactive ? "pointer" : "default", pointerEvents: interactive ? "auto" : "none" }}
          onClick={(event) => {
            if (!interactive) return;
            event.stopPropagation();
            onClick(node.label, neighbor.label, index, neighborIndex, currentOctave, key);
          }}
        >
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={18} />
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={active ? activeColor : inactiveColor}
            strokeOpacity={active ? 0.95 : 0.3}
            strokeWidth={active ? 6 : 4}
            strokeLinecap="round"
            style={{ transition: "all 180ms ease" }}
          />
          {frame && (
            <>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={activeColor}
                strokeOpacity={sweepOpacity}
                strokeWidth={sweepWidth}
                strokeLinecap="round"
                filter="url(#activeGlow)"
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx={sweepX}
                cy={sweepY}
                r={frame === 1 ? 6.5 : frame === 2 ? 5.5 : frame === 3 ? 4.5 : 3.5}
                fill={activeColor}
                fillOpacity={frame === 1 ? 0.95 : frame === 2 ? 0.82 : frame === 3 ? 0.62 : 0.38}
                filter="url(#activeGlow)"
                style={{ pointerEvents: "none" }}
              />
            </>
          )}
        </g>
      );
    }),
  );
}
