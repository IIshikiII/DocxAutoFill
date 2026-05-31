import { useCallback, useState } from "react";
import { processGraphStream } from "../api/client";
import type { ProcessProgress } from "../api/client";
import type { FlowEdge, FlowNode } from "../types";
import { toGraphPayload } from "../utils/graphPayload";

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Drives document generation with a live progress bar via SSE streaming. */
export function useProcessing() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);

  const run = useCallback(
    async (nodes: FlowNode[], edges: FlowEdge[], excel: File, words: File[]) => {
      setProcessing(true);
      setProgress({ done: 0, total: 1, percent: 0, message: "Подготовка…" });
      try {
        const blob = await processGraphStream(
          toGraphPayload(nodes, edges),
          excel,
          words,
          setProgress
        );
        downloadBlob(blob, "archive.zip");
      } catch (error) {
        console.error("Error during processing:", error);
        alert(error instanceof Error ? error.message : "Ошибка при запуске");
      } finally {
        setProcessing(false);
        setProgress(null);
      }
    },
    []
  );

  return { processing, progress, run };
}
