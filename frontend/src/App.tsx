import { useCallback, useState } from "react";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";

import FlowCanvas from "./components/FlowCanvas";
import TopBar from "./components/TopBar";
import DataPanel from "./components/DataPanel";
import ArchivePanel from "./components/ArchivePanel";
import ProgressOverlay from "./components/ProgressOverlay";
import ValidationBanner from "./components/ValidationBanner";
import { useFlowGraph } from "./hooks/useFlowGraph";
import { useFileUploads } from "./hooks/useFileUploads";
import { useArchiveModel } from "./hooks/useArchiveModel";
import { useProcessing } from "./hooks/useProcessing";
import { useTemplates } from "./hooks/useTemplates";
import {
  applyTemplate as applyTemplateApi,
  importNodes as importNodesApi,
} from "./api/client";
import { positionImportedNodes } from "./utils/layout";
import { toGraphPayload } from "./utils/graphPayload";
import { DEFAULT_ARCHIVE_OPTIONS } from "./utils/archiveOptions";
import {
  validateGraph,
  type GraphValidationError,
} from "./utils/graphValidation";
import type { ArchiveEditTarget, ArchiveOptions, NodeData } from "./types";

const App = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useFlowGraph();
  const { wordFiles, excelFile, addWordFiles, removeWordFile, setExcelFile } =
    useFileUploads();
  const archive = useArchiveModel();
  const templates = useTemplates();
  const { processing, progress, run } = useProcessing();
  const [importing, setImporting] = useState(false);
  const [dataOpen, setDataOpen] = useState(true);
  const [archiveOptions, setArchiveOptions] = useState<ArchiveOptions>(
    DEFAULT_ARCHIVE_OPTIONS
  );
  const [validationErrors, setValidationErrors] = useState<
    GraphValidationError[]
  >([]);

  const clearValidation = useCallback(() => {
    setValidationErrors([]);
    setNodes((nds) =>
      nds.map((n) =>
        n.className?.includes("node-error")
          ? { ...n, className: n.className.replace("node-error", "").trim() || undefined }
          : n
      )
    );
  }, [setNodes]);

  // Returns true when the graph is valid; highlights + reports errors otherwise.
  const checkGraph = useCallback((): boolean => {
    const errors = validateGraph(nodes, edges);
    if (errors.length === 0) {
      clearValidation();
      return true;
    }
    const invalidIds = new Set(errors.map((e) => e.nodeId));
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        className: invalidIds.has(n.id)
          ? "node-error"
          : (n.className?.replace("node-error", "").trim() || undefined),
      }))
    );
    setValidationErrors(errors);
    return false;
  }, [nodes, edges, clearValidation, setNodes]);

  // When a new connection is made, re-run validation to clear resolved errors.
  const handleConnect = useCallback(
    (params: Parameters<typeof onConnect>[0]) => {
      onConnect(params);
      if (validationErrors.length > 0) {
        // Optimistically re-validate; edges won't include the new one yet so we
        // add it manually for an instant accurate result.
        const nextEdges = [
          ...edges,
          { id: `_tmp`, source: params.source ?? "", target: params.target ?? "" },
        ];
        const remaining = validateGraph(nodes, nextEdges);
        if (remaining.length === 0) {
          clearValidation();
        } else {
          const invalidIds = new Set(remaining.map((e) => e.nodeId));
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              className: invalidIds.has(n.id)
                ? "node-error"
                : (n.className?.replace("node-error", "").trim() || undefined),
            }))
          );
          setValidationErrors(remaining);
        }
      }
    },
    [onConnect, validationErrors, edges, nodes, clearValidation, setNodes]
  );

  // Editing happens only in the archive-model tree (after "Создать модель
  // архива"). An edited name is applied to the right place: the merged-folder
  // name to options, per-row file names and per-template merged-file names to
  // their violet node.
  const patchNodeData = (id: string, patch: Partial<NodeData>) =>
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
      )
    );

  const handleArchiveEdit = (target: ArchiveEditTarget, template: string) => {
    if (target.kind === "merged_dir") {
      setArchiveOptions((o) => ({ ...o, mergedDirName: template }));
    } else if (target.kind === "merged_file") {
      // Per-template merged-file name lives on the violet node.
      patchNodeData(target.nodeId, { merged_label: template });
    } else {
      patchNodeData(target.nodeId, { label: template });
    }
  };

  const requireFiles = () => {
    if (!excelFile) {
      alert("Пожалуйста, прикрепите файл Excel");
      return false;
    }
    if (wordFiles.length === 0) {
      alert("Пожалуйста, прикрепите хотя бы один файл Word");
      return false;
    }
    return true;
  };

  const importNodes = async () => {
    if (!requireFiles() || !excelFile) {
      return;
    }
    setImporting(true);
    try {
      const response = await importNodesApi(excelFile, wordFiles);
      setNodes(positionImportedNodes(response.nodes));
      setEdges([]);
    } catch (error) {
      console.error("Error importing nodes:", error);
      alert(
        error instanceof Error ? error.message : "Ошибка при импорте узлов"
      );
    } finally {
      setImporting(false);
    }
  };

  const startProcessing = () => {
    if (!requireFiles() || !excelFile) return;
    if (!checkGraph()) return;
    void run(nodes, edges, excelFile, wordFiles, archiveOptions);
  };

  // Save the current connections as a named template (from the archive drawer).
  const handleSaveTemplate = (name: string): Promise<boolean> =>
    templates.save(name, toGraphPayload(nodes, edges));

  // Apply a saved template to the imported nodes: matched connections replace
  // whatever is on the canvas; unmatched nodes are left unconnected.
  const handleApplyTemplate = useCallback(
    async (name: string) => {
      const wireNodes = nodes.map(({ id, type, data }) => ({
        id,
        type: type ?? "",
        data,
      }));
      try {
        const result = await applyTemplateApi(name, wireNodes);
        setEdges(
          result.connections.map((c) => ({
            id: `e_${c.source}_${c.target}`,
            source: c.source,
            target: c.target,
          }))
        );
        clearValidation();
        const missed = result.total - result.matched;
        templates.setNotice({
          kind: missed > 0 ? "warn" : "ok",
          text:
            missed > 0
              ? `Применён «${name}»: восстановлено ${result.matched} из ${result.total} связей (${missed} без совпадений)`
              : `Применён «${name}»: восстановлено ${result.matched} связей`,
        });
      } catch (error) {
        templates.setNotice({
          kind: "err",
          text:
            error instanceof Error
              ? error.message
              : "Не удалось применить шаблон",
        });
      }
    },
    [nodes, setEdges, clearValidation, templates]
  );

  return (
    <div className="app">
      <TopBar
        dataOpen={dataOpen}
        onToggleData={() => setDataOpen((open) => !open)}
        onGenerateModel={() => {
            if (checkGraph()) archive.generate(nodes, edges, archiveOptions);
          }}
        onProcess={startProcessing}
        importing={importing}
        processing={processing}
        isGeneratingModel={archive.loading}
        hasNodes={nodes.length > 0}
      />

      <div className="stage">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
        />

        {nodes.length === 0 && (
          <div className="canvas-hint">
            <div className="canvas-hint-card">
              <div className="canvas-hint-icon">🎯</div>
              <p>
                Откройте «Файлы», загрузите таблицу и шаблоны, затем нажмите
                «Импортировать».
              </p>
            </div>
          </div>
        )}

        <DataPanel
          open={dataOpen}
          onClose={() => setDataOpen(false)}
          wordFiles={wordFiles}
          excelFile={excelFile}
          onAddWordFiles={addWordFiles}
          onRemoveWordFile={removeWordFile}
          onSelectExcel={setExcelFile}
          importing={importing}
          processing={processing}
          onImport={importNodes}
          templates={templates.items}
          templatesBusy={templates.busy}
          templateNotice={templates.notice}
          canApplyTemplate={nodes.length > 0}
          onApplyTemplate={handleApplyTemplate}
          onDeleteTemplate={templates.remove}
          onDismissTemplateNotice={() => templates.setNotice(null)}
        />

        <ArchivePanel
          open={archive.visible}
          model={archive.archiveModel}
          onClose={archive.hide}
          onEdit={handleArchiveEdit}
          savingTemplate={templates.busy}
          onSaveTemplate={handleSaveTemplate}
        />

        <ValidationBanner
          errors={validationErrors}
          onDismiss={clearValidation}
        />

        {progress && <ProgressOverlay progress={progress} />}
      </div>
    </div>
  );
};

export default App;
