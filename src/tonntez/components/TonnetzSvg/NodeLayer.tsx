import { COLORS } from "../../constants";
import type { NodeAnimMap } from "../../hooks/useNodeFrameAnimation";
import type { PitchClass, TonnetzNode } from "../../type";
import type { CoordinateMapper } from "./types";
import NodeCircle from "./NodeCircle";

type Props = {
  nodes: TonnetzNode[];
  radius: number;
  playedPitchClasses: PitchClass[];
  focusedPitchClasses: PitchClass[];
  recentMelodyPitches: Set<PitchClass>;
  highlightedPitchClasses: Set<PitchClass>;
  focusedNodeIndex: number | null;
  showStrongFocus: boolean;
  accentActivePitch: PitchClass | null;
  accentMode: null | "," | ".";
  weakVelocity: number;
  strongVelocity: number;
  nodeFrames: NodeAnimMap;
  toX: CoordinateMapper;
  toY: CoordinateMapper;
  onClick: (pitch: PitchClass, index: number) => void;
};

export default function NodeLayer(props: Props) {
  const {
    nodes, radius, playedPitchClasses, focusedPitchClasses, recentMelodyPitches,
    highlightedPitchClasses, focusedNodeIndex, showStrongFocus, accentActivePitch,
    accentMode, weakVelocity, strongVelocity, nodeFrames, toX, toY, onClick,
  } = props;

  return nodes.map((node, index) => {
    const cx = toX(node.x);
    const cy = toY(node.y);
    const isPlayed = playedPitchClasses.includes(node.label);
    const isFocused = focusedPitchClasses.includes(node.label);
    const isRecent = recentMelodyPitches.has(node.label);
    const isStrongFocus = showStrongFocus && focusedNodeIndex === index;
    const isDiamondNode = highlightedPitchClasses.has(node.label);
    const isHighlighted = isPlayed || isFocused || isDiamondNode;
    const isAccent = node.label === accentActivePitch;
    const frame = nodeFrames[node.label];
    const velocity = isAccent
      ? accentMode === "," ? weakVelocity : accentMode === "." ? strongVelocity : 0.7
      : 0.7;

    let nodeRadius = radius;
    if (isStrongFocus) nodeRadius += 4;
    else if (isHighlighted) nodeRadius += 1.5;
    if (frame === 1) nodeRadius += 5;
    else if (frame === 2) nodeRadius += 3;
    else if (frame === 3) nodeRadius += 1.5;
    if (isAccent) nodeRadius *= 1 + velocity * 0.6;

    const fill = isStrongFocus ? "rgba(255,255,255,1)"
      : isDiamondNode ? "rgba(248,250,255,0.98)"
      : isFocused ? "rgba(239,246,255,0.98)"
      : isPlayed ? "rgba(242,249,253,0.98)"
      : isRecent ? "rgba(255,255,255,0.82)"
      : frame ? "rgba(245,247,255,0.99)"
      : "rgba(255,255,255,0.96)";
    const stroke = isStrongFocus ? "#c05dde"
      : isDiamondNode ? "#E894FF"
      : isFocused ? "#94B9FF"
      : isPlayed ? "#7ca8ff"
      : isRecent ? COLORS.accentBorder
      : frame ? "#E894FF"
      : "rgba(63,81,109,0.74)";
    const strokeWidth = isStrongFocus ? 3.2
      : frame === 1 ? 3
      : frame === 2 ? 2.4
      : isHighlighted ? 2.2
      : isRecent ? 1.6
      : 1.2;
    const textColor = isStrongFocus ? "#9b3fb6"
      : isDiamondNode ? "#b94fd4"
      : isFocused || isPlayed ? "#5d83d8"
      : isRecent ? COLORS.recentText
      : frame ? "#b94fd4"
      : "#26364f";

    return (
      <NodeCircle
        key={`${node.q}-${node.r}`}
        q={node.q}
        r={node.r}
        label={node.label}
        cx={cx}
        cy={cy}
        radius={nodeRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        textColor={textColor}
        fontWeight={isStrongFocus || frame === 1 ? 800 : isHighlighted ? 700 : 600}
        onClick={() => onClick(node.label, index)}
      />
    );
  });
}
