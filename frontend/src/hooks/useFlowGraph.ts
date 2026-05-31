import { useCallback, useEffect } from "react";
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react";
import type { Connection } from "@xyflow/react";
import type { FlowEdge, FlowNode } from "../types";

/** Canvas graph state: nodes/edges plus connection rules and Delete handling. */
export function useFlowGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  // disallow a second incoming edge into a blue target
  const onConnect = useCallback(
    (params: Connection) => {
      const targetNode = nodes.find((n) => n.id === params.target);

      if (targetNode && targetNode.type === "blue") {
        const hasIncoming = edges.some((e) => e.target === params.target);
        if (hasIncoming) {
          return; // запрещаем повторные входящие соединения
        }
      }

      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, nodes, edges]
  );

  // Delete/Backspace removes selected green nodes (with their edges), else selected edges
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") {
        return;
      }

      const selectedGreenIds = nodes
        .filter((n) => n.selected && n.type === "green")
        .map((n) => n.id);

      if (selectedGreenIds.length > 0) {
        setNodes((nds) => nds.filter((n) => !selectedGreenIds.includes(n.id)));
        setEdges((eds) =>
          eds.filter(
            (edge) =>
              !selectedGreenIds.includes(edge.source) &&
              !selectedGreenIds.includes(edge.target) &&
              !edge.selected
          )
        );
        return;
      }

      setEdges((eds) => eds.filter((edge) => !edge.selected));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setEdges, setNodes, nodes]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  };
}
