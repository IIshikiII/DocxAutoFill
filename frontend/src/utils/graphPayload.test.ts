import { describe, expect, it } from "vitest";
import { toGraphPayload } from "./graphPayload";
import type { FlowEdge, FlowNode } from "../types";

describe("toGraphPayload", () => {
  it("strips canvas fields down to the wire shape", () => {
    const nodes: FlowNode[] = [
      {
        id: "g0",
        type: "green",
        position: { x: 1, y: 2 },
        data: { label: "ФИО" },
        selected: true,
      },
    ];
    const edges: FlowEdge[] = [{ id: "e0", source: "g0", target: "b0" }];

    expect(toGraphPayload(nodes, edges)).toEqual({
      nodes: [{ id: "g0", type: "green", data: { label: "ФИО" } }],
      connections: [{ source: "g0", target: "b0" }],
    });
  });

  it("defaults a missing node type to an empty string", () => {
    const nodes = [
      { id: "x", position: { x: 0, y: 0 }, data: { label: "x" } },
    ] as FlowNode[];
    expect(toGraphPayload(nodes, []).nodes[0].type).toBe("");
  });

  it("omits options when none are passed", () => {
    expect(toGraphPayload([], [])).not.toHaveProperty("options");
  });

  it("converts archive options to the snake_case wire shape", () => {
    const payload = toGraphPayload([], [], {
      mergedDirName: "Сводные",
      mergedFileTemplate: "Все_<файл>.docx",
    });
    expect(payload.options).toEqual({
      merged_dir_name: "Сводные",
      merged_file_template: "Все_<файл>.docx",
    });
  });
});
