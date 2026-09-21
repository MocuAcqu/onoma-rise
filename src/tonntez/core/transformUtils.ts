// src/tonnetz/lib/plrDisplay.ts
import type { TonnetzNode, TriangleData } from "../type";

export type PlrMode = "basic" | "P" | "L" | "R";

export type SharedEdgeKind = "horizontal" | "diagRight" | "diagLeft";

export type DiamondOverlayData = {
  polygonPoints: string;
  sharedLine: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  sourceTriangleId: string;
  targetTriangleId: string;
  sharedEdgeKind: SharedEdgeKind;
};

function sameNode(a: TonnetzNode, b: TonnetzNode) {
  return a.q === b.q && a.r === b.r;
}

export function getSharedNodes(a: TriangleData, b: TriangleData) {
  const shared = a.nodes.filter((an) =>
    b.nodes.some((bn) => sameNode(an, bn))
  );
  return shared.length === 2 ? ([shared[0], shared[1]] as const) : null;
}

export function getExclusiveNode(
  tri: TriangleData,
  shared: readonly [TonnetzNode, TonnetzNode]
) {
  return (
    tri.nodes.find(
      (n) => !sameNode(n, shared[0]) && !sameNode(n, shared[1])
    ) ?? null
  );
}

export function getSharedEdgeKind(
  shared: readonly [TonnetzNode, TonnetzNode]
): SharedEdgeKind {
  const [a, b] = shared;
  const dq = b.q - a.q;
  const dr = b.r - a.r;

  if ((dq === 1 && dr === 0) || (dq === -1 && dr === 0)) {
    return "horizontal";
  }
  if ((dq === 0 && dr === 1) || (dq === 0 && dr === -1)) {
    return "diagRight";
  }
  return "diagLeft";
}

export function edgeKindMatchesMode(kind: SharedEdgeKind, mode: PlrMode) {
  if (mode === "basic") return false;
  if (mode === "P") return kind === "horizontal";
  if (mode === "L") return kind === "diagLeft";
  if (mode === "R") return kind === "diagRight";
  return false;
}

export function findModeNeighborTriangle(
  activeTri: TriangleData,
  triangles: TriangleData[],
  mode: Exclude<PlrMode, "basic">
) {
  for (const tri of triangles) {
    if (tri.id === activeTri.id) continue;

    const shared = getSharedNodes(activeTri, tri);
    if (!shared) continue;

    const kind = getSharedEdgeKind(shared);
    if (edgeKindMatchesMode(kind, mode)) {
      return tri;
    }
  }

  return null;
}

export function buildDiamondOverlayData(params: {
  activeTri: TriangleData;
  triangles: TriangleData[];
  mode: PlrMode;
  toX: (x: number) => number;
  toY: (y: number) => number;
}): DiamondOverlayData | null {
  const { activeTri, triangles, mode, toX, toY } = params;

  if (mode === "basic") return null;

  const neighborTri = findModeNeighborTriangle(activeTri, triangles, mode);
  if (!neighborTri) return null;

  const shared = getSharedNodes(activeTri, neighborTri);
  if (!shared) return null;

  const aOnly = getExclusiveNode(activeTri, shared);
  const bOnly = getExclusiveNode(neighborTri, shared);
  if (!aOnly || !bOnly) return null;

  const [s1, s2] = shared;

  return {
    polygonPoints: [
      `${toX(aOnly.x)},${toY(aOnly.y)}`,
      `${toX(s1.x)},${toY(s1.y)}`,
      `${toX(bOnly.x)},${toY(bOnly.y)}`,
      `${toX(s2.x)},${toY(s2.y)}`,
    ].join(" "),
    sharedLine: {
      x1: toX(s1.x),
      y1: toY(s1.y),
      x2: toX(s2.x),
      y2: toY(s2.y),
    },
    sourceTriangleId: activeTri.id,
    targetTriangleId: neighborTri.id,
    sharedEdgeKind: getSharedEdgeKind(shared),
  };
}