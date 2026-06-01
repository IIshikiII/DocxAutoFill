import { describe, expect, it } from "vitest";
import { validateGraph } from "./graphValidation";
import type { FlowEdge, FlowNode } from "../types";

const node = (
  id: string,
  type: string,
  label = id
): FlowNode =>
  ({ id, type, position: { x: 0, y: 0 }, data: { label } }) as FlowNode;

const edge = (source: string, target: string): FlowEdge =>
  ({ id: `${source}-${target}`, source, target }) as FlowEdge;

describe("validateGraph", () => {
  it("returns no errors when all blue nodes are connected", () => {
    const nodes = [node("g1", "green"), node("b1", "blue", "Имя")];
    const edges = [edge("g1", "b1")];
    expect(validateGraph(nodes, edges)).toHaveLength(0);
  });

  it("reports an error for each disconnected blue node", () => {
    const nodes = [
      node("g1", "green"),
      node("b1", "blue", "Имя"),
      node("b2", "blue", "Фамилия"),
    ];
    const errors = validateGraph(nodes, []);
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.nodeId)).toEqual(["b1", "b2"]);
  });

  it("reports an error for a disconnected orange node", () => {
    const nodes = [node("g1", "green"), node("o1", "orange", "Факультет")];
    const errors = validateGraph(nodes, []);
    expect(errors).toHaveLength(1);
    expect(errors[0].nodeId).toBe("o1");
  });

  it("does not report an error for a connected orange node", () => {
    const nodes = [node("g1", "green"), node("o1", "orange")];
    expect(validateGraph(nodes, [edge("g1", "o1")])).toHaveLength(0);
  });

  it("reports an error for a disconnected violet node", () => {
    const nodes = [node("g1", "green"), node("v1", "violet", "Диплом.docx")];
    const errors = validateGraph(nodes, []);
    expect(errors).toHaveLength(1);
    expect(errors[0].nodeId).toBe("v1");
  });

  it("does not report an error for a connected violet node", () => {
    const nodes = [node("g1", "green"), node("v1", "violet", "Диплом.docx")];
    expect(validateGraph(nodes, [edge("g1", "v1")])).toHaveLength(0);
  });

  it("ignores green nodes without incoming edges", () => {
    const nodes = [node("g1", "green")];
    expect(validateGraph(nodes, [])).toHaveLength(0);
  });

  it("returns empty for an empty graph", () => {
    expect(validateGraph([], [])).toHaveLength(0);
  });

  it("mixes blue and orange errors together", () => {
    const nodes = [
      node("g1", "green"),
      node("b1", "blue", "Имя"),
      node("o1", "orange"),
    ];
    const errors = validateGraph(nodes, []);
    expect(errors).toHaveLength(2);
    const ids = errors.map((e) => e.nodeId);
    expect(ids).toContain("b1");
    expect(ids).toContain("o1");
  });

  it("resolves errors when all problematic nodes become connected", () => {
    const nodes = [node("g1", "green"), node("b1", "blue", "Имя")];
    expect(validateGraph(nodes, [edge("g1", "b1")])).toHaveLength(0);
  });
});
