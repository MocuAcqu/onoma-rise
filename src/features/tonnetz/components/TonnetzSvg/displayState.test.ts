import { describe, expect, it } from "vitest";

import PitchUtils from "../../graph/PitchUtils";
import { TonnetzGraph } from "../../graph/TonnetzGraph";
import { createTonnetzDisplayState } from "./displayState";

describe("Tonnetz harmony transition display state", () => {
  it("keeps the current triangle active and exposes the previous one separately", () => {
    const { triangles } = TonnetzGraph.sliceRange(-3, 3, -3, 3);
    const currentChordKey = PitchUtils.getChordKey(["C", "E", "G"]);
    const previousChordKey = PitchUtils.getChordKey(["A", "C", "E"]);
    const currentIds = triangles
      .filter((triangle) => PitchUtils.getChordKey(triangle.chord) === currentChordKey)
      .map((triangle) => triangle.id);
    const previousIds = triangles
      .filter((triangle) => PitchUtils.getChordKey(triangle.chord) === previousChordKey)
      .map((triangle) => triangle.id);

    const display = createTonnetzDisplayState({
      scale: 80,
      triangles,
      activeChordKey: currentChordKey,
      previousChordKey,
      activeEdgePitchPair: null,
      selectedDiamondPitchSet: null,
      transformMode: "basic",
      transitionFrame: null,
    });

    expect(currentIds.length).toBeGreaterThan(0);
    expect(previousIds.length).toBeGreaterThan(0);
    expect(currentIds.every((id) => display.highlightedTriangleIds.has(id))).toBe(true);
    expect(previousIds.every((id) => display.previousTriangleIds.has(id))).toBe(true);
  });
});
