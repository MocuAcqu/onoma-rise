import type { TransformMode } from "../../hooks/useTransformTransition";
import type { TriangleData } from "../../type";
import type { CoordinateMapper } from "./types";

type Props = {
  triangles: TriangleData[];
  highlightedIds: Set<string>;
  transformMode: TransformMode;
  toX: CoordinateMapper;
  toY: CoordinateMapper;
  onClick: (triangle: TriangleData) => void;
};

export default function TriangleLayer({
  triangles,
  highlightedIds,
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
    const fill = isActive
      ? triangle.type === "major" ? "rgba(232,148,255,0.36)" : "rgba(148,185,255,0.42)"
      : triangle.type === "major" ? "rgba(232,148,255,0.10)" : "rgba(148,185,255,0.12)";

    return (
      <polygon
        key={triangle.id}
        points={points}
        fill={fill}
        stroke="transparent"
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
