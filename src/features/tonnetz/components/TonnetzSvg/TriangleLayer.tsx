import { memo } from "react";
import type { TransformMode } from "../../graph/useTransformTransition";
import type { TriangleData } from "../../types";
import type { CoordinateMapper } from "./types";

type Props = {
  triangles: TriangleData[];
  highlightedIds: Set<string>;
  previousIds: Set<string>;
  transformMode: TransformMode;
  toX: CoordinateMapper;
  toY: CoordinateMapper;
  onClick: (triangle: TriangleData) => void;
};

function TriangleLayer({
  triangles,
  highlightedIds,
  previousIds,
  transformMode,
  toX,
  toY,
  onClick,
}: Props) {
  const isInteractive = transformMode === "basic";

  return triangles.map((triangle) => {
    const points = triangle.nodes
      .map((node) => `${toX(node.x)},${toY(node.y)}`)
      .join(" ");
    const isActive = highlightedIds.has(triangle.id);
    const isPrevious = !isActive && previousIds.has(triangle.id);
    const fill = isActive
      ? triangle.type === "major" ? "rgba(232,148,255,0.36)" : "rgba(148,185,255,0.42)"
      : isPrevious ? "rgba(148,163,184,0.18)"
      : triangle.type === "major" ? "rgba(232,148,255,0.10)" : "rgba(148,185,255,0.12)";

    return (
      <polygon
        key={triangle.id}
        points={points}
        fill={fill}
        stroke={isPrevious ? "rgba(109,40,217,0.28)" : "transparent"}
        strokeWidth={isPrevious ? 1.2 : 0}
        strokeDasharray={isPrevious ? "4 4" : undefined}
        style={{
          cursor: isInteractive ? "pointer" : "default",
          transition: "fill 180ms ease",
          pointerEvents: isInteractive ? "auto" : "none",
        }}
        onClick={(event) => {
          if (!isInteractive) return;
          event.stopPropagation();
          onClick(triangle);
        }}
      />
    );
  });
}

export default memo(TriangleLayer);
