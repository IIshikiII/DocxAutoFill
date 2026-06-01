import type { FlowEdge, FlowNode } from "../types";

export interface GraphValidationError {
  nodeId: string;
  label: string;
  /** i18n key resolved by the view; interpolate `{label}` where present. */
  messageKey: string;
}

/** Returns validation errors for the current graph state.
 *  An empty array means the graph is valid. Checks:
 *  - every blue node has exactly one incoming edge
 *  - the orange node (if present) has an incoming edge */
export function validateGraph(
  nodes: FlowNode[],
  edges: FlowEdge[]
): GraphValidationError[] {
  const errors: GraphValidationError[] = [];
  const connectedTargets = new Set(edges.map((e) => e.target));

  for (const node of nodes) {
    if (node.type === "blue" && !connectedTargets.has(node.id)) {
      errors.push({
        nodeId: node.id,
        label: node.data.label,
        messageKey: "validation.varNotConnected",
      });
    }
    if (node.type === "violet" && !connectedTargets.has(node.id)) {
      errors.push({
        nodeId: node.id,
        label: node.data.label,
        messageKey: "validation.templateNotConnected",
      });
    }
    if (node.type === "orange" && !connectedTargets.has(node.id)) {
      errors.push({
        nodeId: node.id,
        label: node.data.label,
        messageKey: "validation.foldersNotConnected",
      });
    }
  }

  return errors;
}
