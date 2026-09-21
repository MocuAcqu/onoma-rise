import { buildDiamondOverlayData } from "../../core/transformUtils";
import type { DiamondOverlayData } from "../../core/transformUtils";
import type { TransformMode } from "../../hooks/useTransformTransition";
import type { PitchClass, TriangleData } from "../../type";
import type { CoordinateMapper } from "./types";

type Props = {
  triangles: TriangleData[];
  transformMode: Exclude<TransformMode, "basic">;
  selectedPitchSet: PitchClass[] | null;
  activeDiamond: DiamondOverlayData | null;
  toX: CoordinateMapper;
  toY: CoordinateMapper;
  onClick: (triangle: TriangleData) => void;
};

export default function DiamondLayer({
  triangles,
  transformMode,
  selectedPitchSet,
  activeDiamond,
  toX,
  toY,
  onClick,
}: Props) {
  const rendered = new Set<string>();

  return triangles.map((triangle) => {
    const diamond = buildDiamondOverlayData({
      activeTri: triangle,
      triangles,
      mode: transformMode,
      toX,
      toY,
    });
    if (!diamond) return null;

    const pairKey = [diamond.sourceTriangleId, diamond.targetTriangleId].sort().join("--");
    if (rendered.has(pairKey)) return null;
    rendered.add(pairKey);

    const source = triangles.find((item) => item.id === diamond.sourceTriangleId);
    const target = triangles.find((item) => item.id === diamond.targetTriangleId);
    if (!source || !target) return null;

    const pitchSet = Array.from(new Set([...source.chord, ...target.chord]));
    const activePairKey = activeDiamond
      ? [activeDiamond.sourceTriangleId, activeDiamond.targetTriangleId].sort().join("--")
      : null;
    const isActive = selectedPitchSet
      ? pitchSet.length === selectedPitchSet.length &&
        pitchSet.every((pitch) => selectedPitchSet.includes(pitch))
      : activePairKey === pairKey;

    return (
      <g
        key={`diamond-${pairKey}-${transformMode}`}
        style={{ cursor: "pointer" }}
        onClick={(event) => {
          event.stopPropagation();
          onClick(triangle);
        }}
      >
        <polygon
          points={diamond.polygonPoints}
          fill={isActive ? "rgba(232,148,255,0.18)" : "rgba(148,185,255,0.10)"}
          stroke={isActive ? "#E894FF" : "rgba(148,185,255,0.70)"}
          strokeWidth={2}
          style={{ transition: "all 180ms ease" }}
        />
      </g>
    );
  });
}
