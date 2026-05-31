import type { Edge, Node } from "@xyflow/react";

/** Canvas node colors / roles (see CLAUDE.md domain model). */
export type NodeType = "green" | "blue" | "violet" | "orange";

/** Data carried by every canvas node. */
export type NodeData = {
  label: string;
  category?: string;
};

/** A ReactFlow node as used on the canvas. */
export type FlowNode = Node<NodeData>;

/** A ReactFlow edge as used on the canvas. */
export type FlowEdge = Edge;

/** Minimal node shape sent to / received from the backend. */
export interface WireNode {
  id: string;
  type: string;
  data: NodeData;
}

/** A single source → target connection. */
export interface WireEdge {
  source: string;
  target: string;
}

/** Graph payload sent to `/archive-model` and `/process`. */
export interface GraphPayload {
  nodes: WireNode[];
  connections: WireEdge[];
}

/** Response of `/import-nodes`. */
export interface ImportResponse {
  status: string;
  received: { excel: string | null; words: string[] };
  nodes: WireNode[];
}

/** Props passed to a custom canvas node component. */
export interface NodeComponentProps {
  data: NodeData;
  selected?: boolean;
}

/** Node of the archive-preview tree returned by `/archive-model`. */
export interface ArchiveItem {
  label: string;
  type: "folder" | "file";
  children?: ArchiveItem[];
}
