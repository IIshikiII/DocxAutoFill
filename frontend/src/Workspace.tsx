import { useCallback, useState } from "react";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";

import FlowCanvas from "./components/FlowCanvas";
import TopBar from "./components/TopBar";
import DataPanel from "./components/DataPanel";
import ArchivePanel from "./components/ArchivePanel";
import AdminPanel from "./components/AdminPanel";
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
import { useI18n } from "./i18n";
import type {
  ArchiveEditTarget,
  ArchiveOptions,
  AuthUser,
  NodeData,
} from "./types";

interface WorkspaceProps {
  user: AuthUser;
  onLogout: () => void;
}

/** The authenticated application: canvas, panels and per-user templates.
 *  Mounted with a `key` of the user id, so switching accounts starts fresh. */
const Workspace = ({ user, onLogout }: WorkspaceProps) => {
  const { t } = useI18n();
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
  const [adminOpen, setAdminOpen] = useState(false);
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
      patchNodeData(target.nodeId, { merged_label: template });
    } else {
      patchNodeData(target.nodeId, { label: template });
    }
  };

  const requireFiles = () => {
    if (!excelFile) {
      alert(t("ws.attachExcel"));
      return false;
    }
    if (wordFiles.length === 0) {
      alert(t("ws.attachWord"));
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
      alert(error instanceof Error ? error.message : t("ws.importFailed"));
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
              ? t("ws.applyPartial", {
                  name,
                  matched: result.matched,
                  total: result.total,
                  missed,
                })
              : t("ws.applyOk", { name, matched: result.matched }),
        });
      } catch (error) {
        templates.setNotice({
          kind: "err",
          text:
            error instanceof Error ? error.message : t("ws.applyFailed"),
        });
      }
    },
    [nodes, setEdges, clearValidation, templates, t]
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
        user={user}
        onOpenAdmin={() => setAdminOpen(true)}
        onLogout={onLogout}
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
              <p>{t("ws.canvasHint")}</p>
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

        <ValidationBanner errors={validationErrors} onDismiss={clearValidation} />

        {progress && <ProgressOverlay progress={progress} />}
      </div>

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        currentUserId={user.id}
      />
    </div>
  );
};

export default Workspace;
