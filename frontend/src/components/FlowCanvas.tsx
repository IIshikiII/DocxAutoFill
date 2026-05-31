import { useMemo } from "react";
import { Background, ReactFlow } from "@xyflow/react";
import type { OnConnect, OnEdgesChange, OnNodesChange } from "@xyflow/react";
import GreenNode from "./nodes/GreenNode";
import BlueNode from "./nodes/BlueNode";
import VioletNode from "./nodes/VioletNode";
import OrangeNode from "./nodes/OrangeNode";
import {
  NodeCategoriesProvider,
  type CategoriesByType,
} from "../context/NodeCategoriesContext";
import { uniqueCategories } from "../utils/nodeColors";
import type { FlowEdge, FlowNode } from "../types";

const nodeTypes = {
  green: GreenNode,
  blue: BlueNode,
  violet: VioletNode,
  orange: OrangeNode,
};

interface FlowCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange<FlowEdge>;
  onConnect: OnConnect;
}

const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: FlowCanvasProps) => {
  // Per-type category lists drive blue/violet shading via context (no global).
  const categories = useMemo<CategoriesByType>(
    () => ({
      blue: uniqueCategories(nodes, "blue"),
      violet: uniqueCategories(nodes, "violet"),
    }),
    [nodes]
  );

  return (
    <NodeCategoriesProvider value={categories}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
      </ReactFlow>
    </NodeCategoriesProvider>
  );
};

export default FlowCanvas;
