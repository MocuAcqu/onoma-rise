import { COLORS } from "../../config";
import type { NodeAnimMap } from "../../graph/useNodeFrameAnimation";
import type { PitchClass, TonnetzNode } from "../../types";
import type { CoordinateMapper } from "./types";

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
  previousHarmonyPitchClasses: readonly PitchClass[];
  commonHarmonyPitchClasses: readonly PitchClass[];
  addedHarmonyPitchClasses: readonly PitchClass[];
  isHarmonyAdditionActive: boolean;
  toX: CoordinateMapper;
  toY: CoordinateMapper;
};

export default function NodeHaloLayer(props: Props) {
  const {
    nodes, radius, playedPitchClasses, focusedPitchClasses, recentMelodyPitches,
    highlightedPitchClasses, focusedNodeIndex, showStrongFocus, accentActivePitch,
    accentMode, weakVelocity, strongVelocity, nodeFrames,
    previousHarmonyPitchClasses, commonHarmonyPitchClasses,
    addedHarmonyPitchClasses, isHarmonyAdditionActive, toX, toY,
  } = props;

  return nodes.map((node, index) => {
    const cx = toX(node.x);
    const cy = toY(node.y);
    const isPlayed = playedPitchClasses.includes(node.label);
    const isFocused = focusedPitchClasses.includes(node.label);
    const isRecent = recentMelodyPitches.has(node.label);
    const isStrongFocus = showStrongFocus && focusedNodeIndex === index;
    const isHighlighted = isPlayed || isFocused || highlightedPitchClasses.has(node.label);
    const isPreviousHarmony = previousHarmonyPitchClasses.includes(node.label);
    const isCommonHarmony = commonHarmonyPitchClasses.includes(node.label);
    const isNewHarmonyAccent = isHarmonyAdditionActive
      && addedHarmonyPitchClasses.includes(node.label);
    const isAccent = node.label === accentActivePitch;
    const frame = nodeFrames[node.label];
    if (
      !isHighlighted
      && !isRecent
      && !isStrongFocus
      && !isAccent
      && !isPreviousHarmony
      && !isCommonHarmony
      && !isNewHarmonyAccent
      && frame === undefined
    ) return null;

    const velocity = isAccent
      ? accentMode === "," ? weakVelocity : accentMode === "." ? strongVelocity : 0.7
      : 0.7;
    const glowSize = velocity * 10;

    return (
      <g key={`halo-${index}`} style={{ pointerEvents: "none" }}>
        {isPreviousHarmony && !isCommonHarmony && (
          <circle
            cx={cx}
            cy={cy}
            r={radius + 7}
            fill="rgba(148,163,184,0.10)"
            stroke="rgba(100,116,139,0.22)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        )}
        {isCommonHarmony && (
          <>
            <circle cx={cx} cy={cy} r={radius + 12} fill="rgba(139,92,246,0.13)" filter="url(#activeGlow)" />
            <circle cx={cx} cy={cy} r={radius + 6} fill="rgba(232,148,255,0.12)" />
          </>
        )}
        {isNewHarmonyAccent && (
          <>
            <circle cx={cx} cy={cy} r={radius + 18} fill="rgba(236,72,153,0.15)" filter="url(#activeGlow)" />
            <circle cx={cx} cy={cy} r={radius + 10} fill="rgba(251,191,36,0.12)" />
          </>
        )}
        {frame === 1 && (
          <>
            <circle cx={cx} cy={cy} r={radius + 16} fill="rgba(148,185,255,0.22)" filter="url(#activeGlow)" />
            <circle cx={cx} cy={cy} r={radius + 10} fill="rgba(232,148,255,0.18)" filter="url(#activeGlow)" />
          </>
        )}
        {frame === 2 && (
          <>
            <circle cx={cx} cy={cy} r={radius + 12} fill="rgba(148,185,255,0.16)" filter="url(#activeGlow)" />
            <circle cx={cx} cy={cy} r={radius + 7} fill="rgba(232,148,255,0.14)" filter="url(#activeGlow)" />
          </>
        )}
        {frame === 3 && <circle cx={cx} cy={cy} r={radius + 6} fill="rgba(148,185,255,0.12)" filter="url(#recentGlow)" />}
        {isHighlighted && (
          <>
            <circle cx={cx} cy={cy} r={30} fill={COLORS.accentSoft} filter="url(#activeGlow)" />
            <circle cx={cx} cy={cy} r={22} fill={COLORS.accentSoft2} filter="url(#activeGlow)" />
          </>
        )}
        {isRecent && !isHighlighted && <circle cx={cx} cy={cy} r={23} fill="rgba(148,185,255,0.10)" filter="url(#recentGlow)" />}
        {isAccent && glowSize > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={radius + 10 + glowSize * 1.5}
            fill={COLORS.accentSoft}
            filter="url(#activeGlow)"
            opacity={Math.min(0.9, glowSize / 10)}
          />
        )}
        {isStrongFocus && (
          <>
            <circle cx={cx} cy={cy} r={36} fill="rgba(232,148,255,0.16)" filter="url(#activeGlow)" />
            <circle cx={cx} cy={cy} r={28} fill="rgba(148,185,255,0.14)" filter="url(#activeGlow)" />
          </>
        )}
      </g>
    );
  });
}
