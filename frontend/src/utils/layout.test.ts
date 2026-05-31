import { describe, expect, it } from "vitest";
import { positionImportedNodes } from "./layout";
import type { WireNode } from "../types";

const wire = (id: string, type: string): WireNode => ({
  id,
  type,
  data: { label: id },
});

describe("positionImportedNodes", () => {
  const source: WireNode[] = [
    wire("v0", "violet"),
    wire("g0", "green"),
    wire("b0", "blue"),
    wire("o1", "orange"),
  ];

  it("keeps every node and assigns a position to each", () => {
    const result = positionImportedNodes(source);
    expect(result).toHaveLength(4);
    expect(result.every((n) => n.position)).toBe(true);
  });

  it("lays out columns: violet/orange left, blue middle, green right", () => {
    const byId = Object.fromEntries(
      positionImportedNodes(source).map((n) => [n.id, n.position.x])
    );
    expect(byId.v0).toBe(-60);
    expect(byId.o1).toBe(-60);
    expect(byId.b0).toBe(180);
    expect(byId.g0).toBe(450);
  });

  it("places the orange node below the violet column", () => {
    const result = positionImportedNodes(source);
    const violet = result.find((n) => n.id === "v0")!;
    const orange = result.find((n) => n.id === "o1")!;
    expect(orange.position.y).toBeGreaterThan(violet.position.y);
  });
});
