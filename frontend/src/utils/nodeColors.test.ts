import { describe, expect, it } from "vitest";
import {
  BLUE_PALETTE,
  categoryLabel,
  generateShade,
  uniqueCategories,
} from "./nodeColors";
import type { FlowNode } from "../types";

const node = (id: string, type: string, category?: string): FlowNode =>
  ({
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, category },
  }) as FlowNode;

describe("generateShade", () => {
  it("uses the lightest shade for a single category", () => {
    expect(generateShade(BLUE_PALETTE, 0, 1)).toEqual({
      background: "hsl(210, 90%, 85%)",
      border: "hsl(210, 90%, 65%)",
    });
  });

  it("darkens as the category index grows", () => {
    expect(generateShade(BLUE_PALETTE, 1, 3)).toEqual({
      background: "hsl(210, 90%, 70%)",
      border: "hsl(210, 90%, 50%)",
    });
  });

  it("clamps the border lightness to a 20% floor", () => {
    // Degenerate index drives lightness negative; the border must still floor at 20%.
    expect(generateShade(BLUE_PALETTE, 10, 1).border).toBe("hsl(210, 90%, 20%)");
  });
});

describe("uniqueCategories", () => {
  it("returns distinct categories of a single node type, in first-seen order", () => {
    const nodes = [
      node("b0", "blue", "a"),
      node("b1", "blue", "b"),
      node("b2", "blue", "a"),
      node("v0", "violet", "c"),
      node("g0", "green"),
    ];
    expect(uniqueCategories(nodes, "blue")).toEqual(["a", "b"]);
    expect(uniqueCategories(nodes, "violet")).toEqual(["c"]);
    expect(uniqueCategories(nodes, "orange")).toEqual([]);
  });
});

describe("categoryLabel", () => {
  it("capitalizes the first letter", () => {
    expect(categoryLabel("table")).toBe("Table");
    expect(categoryLabel("")).toBe("");
  });
});
