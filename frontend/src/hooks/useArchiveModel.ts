import { useCallback, useState } from "react";
import { getArchiveModel } from "../api/client";
import type { ArchiveItem, ArchiveOptions, FlowEdge, FlowNode } from "../types";
import { toGraphPayload } from "../utils/graphPayload";
import { useI18n } from "../i18n";

/** Archive-preview state plus the request that builds it from the current graph. */
export function useArchiveModel() {
  const { t } = useI18n();
  const [archiveModel, setArchiveModel] = useState<ArchiveItem | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async (nodes: FlowNode[], edges: FlowEdge[], options: ArchiveOptions) => {
      setLoading(true);
      try {
        const orangeNode = nodes.find((n) => n.type === "orange");
        if (!orangeNode) {
          alert(t("archiveModel.noOrange"));
          return;
        }

        const hasGreenLink = edges.some((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          return (
            (sourceNode?.type === "green" &&
              targetNode?.id === orangeNode.id) ||
            (targetNode?.type === "green" && sourceNode?.id === orangeNode.id)
          );
        });

        if (!hasGreenLink) {
          alert(t("archiveModel.needGreenOrange"));
          return;
        }

        const model = await getArchiveModel(
          toGraphPayload(nodes, edges, options)
        );
        setArchiveModel(model);
        setVisible(true);
      } catch (error) {
        console.error("Error generating archive model:", error);
        alert(
          error instanceof Error
            ? error.message
            : t("archiveModel.buildFailed")
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const hide = useCallback(() => setVisible(false), []);

  return { archiveModel, visible, loading, generate, hide };
}
