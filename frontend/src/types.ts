import type { Edge, Node } from "@xyflow/react";

/** Canvas node colors / roles (see CLAUDE.md domain model). */
export type NodeType = "green" | "blue" | "violet" | "orange";

/** Data carried by every canvas node. */
export type NodeData = {
  label: string;
  category?: string;
  /** Per-template merged-file name (violet nodes), set by editing the archive
   *  tree. Absent → the default ("Объединённый_<template>.docx") is used. */
  merged_label?: string;
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

/** Configurable archive names (Stage 10), in UI form. The grouping folders and
 *  the substituted `<…>` part of file names are data-derived and not included. */
export interface ArchiveOptions {
  mergedDirName: string;
  mergedFileTemplate: string;
}

/** Archive options as sent to the backend (snake_case wire shape). */
export interface WireArchiveOptions {
  merged_dir_name: string;
  merged_file_template: string;
}

/** Graph payload sent to `/archive-model` and `/process`. */
export interface GraphPayload {
  nodes: WireNode[];
  connections: WireEdge[];
  options?: WireArchiveOptions;
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

/** One segment of an editable archive name. `text` is editable; `lock` (the
 *  Excel substitution) and `ext` (the file extension) are frozen. */
export type ArchiveSegment =
  | { kind: "text"; value: string }
  | { kind: "lock"; value: string; token: string }
  | { kind: "ext"; value: string };

/** Where an edited name template should be applied. */
export type ArchiveEditTarget =
  | { kind: "merged_dir" }
  | { kind: "merged_file"; nodeId: string }
  | { kind: "file"; nodeId: string };

/** Editing metadata attached to an editable archive-tree item. */
export interface ArchiveEdit {
  target: ArchiveEditTarget;
  segments: ArchiveSegment[];
}

/** Node of the archive-preview tree returned by `/archive-model`. */
export interface ArchiveItem {
  label: string;
  type: "folder" | "file";
  children?: ArchiveItem[];
  edit?: ArchiveEdit;
}
