import { describe, expect, it } from "vitest";
import { edgeKindMatchesMode, getSharedEdgeKind } from "./transformUtils";
import type { TonnetzNode } from "../types";

const node = (q: number, r: number): TonnetzNode => ({ q, r, x: q, y: r, label: "C" });

describe("transformUtils", () => {
  it("identifies all three Tonnetz edge directions", () => {
    expect(getSharedEdgeKind([node(0, 0), node(1, 0)])).toBe("horizontal");
    expect(getSharedEdgeKind([node(0, 0), node(0, 1)])).toBe("diagRight");
    expect(getSharedEdgeKind([node(0, 0), node(-1, 1)])).toBe("diagLeft");
  });

  it("maps PLR modes to their shared edge", () => {
    expect(edgeKindMatchesMode("horizontal", "P")).toBe(true);
    expect(edgeKindMatchesMode("diagLeft", "L")).toBe(true);
    expect(edgeKindMatchesMode("diagRight", "R")).toBe(true);
    expect(edgeKindMatchesMode("horizontal", "basic")).toBe(false);
  });
});
