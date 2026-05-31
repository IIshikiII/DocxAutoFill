import { useCallback, useState } from "react";
import { getArchiveModel } from "../api/client";
import type { ArchiveItem, FlowEdge, FlowNode } from "../types";
import { toGraphPayload } from "../utils/graphPayload";

/** Archive-preview state plus the request that builds it from the current graph. */
export function useArchiveModel() {
  const [archiveModel, setArchiveModel] = useState<ArchiveItem | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (nodes: FlowNode[], edges: FlowEdge[]) => {
    setLoading(true);
    try {
      const orangeNode = nodes.find((n) => n.type === "orange");
      if (!orangeNode) {
        alert(
          'Не найден оранжевый узел ("разбивать на папки"). Пожалуйста, добавьте оранжевый узел.'
        );
        return;
      }

      const hasGreenLink = edges.some((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        return (
          (sourceNode?.type === "green" && targetNode?.id === orangeNode.id) ||
          (targetNode?.type === "green" && sourceNode?.id === orangeNode.id)
        );
      });

      if (!hasGreenLink) {
        alert(
          'Нужно соединение хотя бы одного зелёного узла с оранжевым узлом "разбивать на папки"'
        );
        return;
      }

      const model = await getArchiveModel(toGraphPayload(nodes, edges));
      setArchiveModel(model);
      setVisible(true);
    } catch (error) {
      console.error("Error generating archive model:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Ошибка при создании модели архива"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return { archiveModel, visible, loading, generate, hide };
}
