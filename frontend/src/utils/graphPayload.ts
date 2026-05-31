import type { FlowEdge, FlowNode, GraphPayload, WireNode } from "../types";

/** Convert canvas nodes + edges into the wire payload sent to the backend. */
export function toGraphPayload(
  nodes: FlowNode[],
  edges: FlowEdge[]
): GraphPayload {
  return {
    nodes: nodes.map(({ id, type, data }) => ({
      id,
      type: type ?? "",
      data,
    })) as WireNode[],
    connections: edges.map(({ source, target }) => ({ source, target })),
  };
}
