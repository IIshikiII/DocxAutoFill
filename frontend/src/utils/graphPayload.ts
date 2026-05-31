import type {
  ArchiveOptions,
  FlowEdge,
  FlowNode,
  GraphPayload,
  WireNode,
} from "../types";
import { toWireOptions } from "./archiveOptions";

/** Convert canvas nodes + edges (and optional archive options) into the wire
 *  payload sent to the backend. */
export function toGraphPayload(
  nodes: FlowNode[],
  edges: FlowEdge[],
  options?: ArchiveOptions
): GraphPayload {
  return {
    nodes: nodes.map(({ id, type, data }) => ({
      id,
      type: type ?? "",
      data,
    })) as WireNode[],
    connections: edges.map(({ source, target }) => ({ source, target })),
    ...(options ? { options: toWireOptions(options) } : {}),
  };
}
