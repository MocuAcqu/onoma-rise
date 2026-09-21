import type { EdgeAnimMap } from "../../hooks/useEdgeFrameAnimation";
import type { NodeAnimMap } from "../../hooks/useNodeFrameAnimation";
import type { TransformFrame, TransformMode } from "../../hooks/useTransformTransition";
import type { PitchClass, TonnetzNode, TriangleData } from "../../type";

export type CoordinateMapper = (value: number) => number;

export type TonnetzSvgProps = {
  nodes: TonnetzNode[];
  triangles: TriangleData[];
  scale?: number;
  radius?: number;
  playedPitchClasses: PitchClass[];
  focusedPitchClasses: PitchClass[];
  focusedNodeIndex: number | null;
  showStrongFocus: boolean;
  activeChordKey: string | null;
  recentMelodyPitches: Set<PitchClass>;
  activeEdgeKey: string | null;
  activeEdgePitchPair: [PitchClass, PitchClass] | null;
  edgeFrames: EdgeAnimMap;
  nodeFrames: NodeAnimMap;
  currentOctave: number;
  accentActivePitch: PitchClass | null;
  accentMode: null | "," | ".";
  weakVelocity: number;
  strongVelocity: number;
  transformMode: TransformMode;
  transitionFrame: TransformFrame | null;
  isTransitioning: boolean;
  selectedDiamondPitchSet: PitchClass[] | null;
  onViewportChange?: (bounds: { qMin: number; qMax: number; rMin: number; rMax: number }) => void;
  onClickNode: (label: PitchClass, index: number) => void;
  onClickTriangle: (triangle: TriangleData) => void;
  onClickEdge: (
    from: PitchClass,
    to: PitchClass,
    fromIndex: number,
    toIndex: number,
    octave: number,
    key: string,
  ) => void;
};
