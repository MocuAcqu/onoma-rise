import type { PitchClass } from "./music";

export type TonnetzNode = {
  q: number;
  r: number;
  x: number;
  y: number;
  label: PitchClass;
};

export type TriangleType = "major" | "minor";

export type TriangleData = {
  id: string;
  type: TriangleType;
  nodes: [TonnetzNode, TonnetzNode, TonnetzNode];
  chord: [PitchClass, PitchClass, PitchClass];
};
