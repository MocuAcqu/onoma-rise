import PitchUtils from "../../core/PitchUtils";
import { buildDiamondOverlayData } from "../../core/transformUtils";
import type { TransformFrame, TransformMode } from "../../hooks/useTransformTransition";
import type { PitchClass, TriangleData } from "../../type";

type Options = {
  scale: number;
  triangles: TriangleData[];
  activeChordKey: string | null;
  activeEdgePitchPair: [PitchClass, PitchClass] | null;
  selectedDiamondPitchSet: PitchClass[] | null;
  transformMode: TransformMode;
  transitionFrame: TransformFrame | null;
};

export const LATTICE_OFFSET_X = 80;
export const LATTICE_OFFSET_Y = 100;

export function createTonnetzDisplayState({
  scale,
  triangles,
  activeChordKey,
  activeEdgePitchPair,
  selectedDiamondPitchSet,
  transformMode,
  transitionFrame,
}: Options) {
  const toX = (x: number) => LATTICE_OFFSET_X + x * scale;
  const toY = (y: number) => LATTICE_OFFSET_Y + y * scale;
  const transitionScale = transitionFrame === 1 ? 0.96
    : transitionFrame === 2 ? 0.92
    : transitionFrame === 3 ? 0.98
    : 1;
  const transitionOpacity = transitionFrame === 1 ? 0.82
    : transitionFrame === 2 ? 0.58
    : transitionFrame === 3 ? 0.9
    : 1;
  const transitionBlur = transitionFrame === 1 ? 1
    : transitionFrame === 2 ? 2.2
    : transitionFrame === 3 ? 0.8
    : 0;

  const activeTriangle = activeChordKey === null
    ? null
    : triangles.find(
      (triangle) => PitchUtils.getChordKey(triangle.chord) === activeChordKey,
    ) ?? null;

  const activeDiamond = transformMode !== "basic" && activeTriangle
    ? buildDiamondOverlayData({
      activeTri: activeTriangle,
      triangles,
      mode: transformMode,
      toX,
      toY,
    })
    : null;

  const highlightedPitchClasses = new Set<PitchClass>();
  if (selectedDiamondPitchSet) {
    selectedDiamondPitchSet.forEach((pitch) => highlightedPitchClasses.add(pitch));
  } else if (transformMode === "basic") {
    activeTriangle?.nodes.forEach((node) => highlightedPitchClasses.add(node.label));
    activeEdgePitchPair?.forEach((pitch) => highlightedPitchClasses.add(pitch));
  } else if (activeDiamond) {
    const triangleIds = new Set([
      activeDiamond.sourceTriangleId,
      activeDiamond.targetTriangleId,
    ]);
    triangles
      .filter((triangle) => triangleIds.has(triangle.id))
      .forEach((triangle) => {
        triangle.nodes.forEach((node) => highlightedPitchClasses.add(node.label));
      });
  }

  const highlightedTriangleIds = new Set<string>();
  if (selectedDiamondPitchSet) {
    triangles.forEach((triangle) => {
      if (triangle.chord.every((pitch) => selectedDiamondPitchSet.includes(pitch))) {
        highlightedTriangleIds.add(triangle.id);
      }
    });
  } else if (transformMode === "basic" && activeTriangle) {
    const activeChord = new Set(activeTriangle.chord);
    triangles.forEach((triangle) => {
      if (triangle.chord.every((pitch) => activeChord.has(pitch))) {
        highlightedTriangleIds.add(triangle.id);
      }
    });
  } else if (highlightedPitchClasses.size > 0) {
    triangles.forEach((triangle) => {
      if (triangle.chord.every((pitch) => highlightedPitchClasses.has(pitch))) {
        highlightedTriangleIds.add(triangle.id);
      }
    });
  }

  return {
    toX,
    toY,
    transitionScale,
    transitionOpacity,
    transitionBlur,
    activeDiamond,
    highlightedPitchClasses,
    highlightedTriangleIds,
  };
}
