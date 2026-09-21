import { memo } from "react";
import type { PitchClass } from "../../type";

type Props = {
  q: number;
  r: number;
  label: PitchClass;
  cx: number;
  cy: number;
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  textColor: string;
  fontWeight: number;
  onClick: () => void;
};

function NodeCircle({
  label, cx, cy, radius, fill, stroke, strokeWidth, textColor, fontWeight, onClick,
}: Props) {
  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer", transition: "all 220ms ease" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ transition: "all 220ms ease" }}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={fontWeight}
        fill={textColor}
        style={{ userSelect: "none", pointerEvents: "none", transition: "all 220ms ease" }}
      >
        {label}
      </text>
    </g>
  );
}

function propsAreEqual(prev: Props, next: Props): boolean {
  return prev.q === next.q
    && prev.r === next.r
    && prev.cx === next.cx
    && prev.cy === next.cy
    && prev.radius === next.radius
    && prev.fill === next.fill
    && prev.stroke === next.stroke
    && prev.strokeWidth === next.strokeWidth
    && prev.textColor === next.textColor
    && prev.fontWeight === next.fontWeight;
}

export default memo(NodeCircle, propsAreEqual);
