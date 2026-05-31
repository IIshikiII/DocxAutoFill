import { useState } from "react";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";

import FlowCanvas from "./components/FlowCanvas";
import FileUploadPanel from "./components/FileUploadPanel";
import ActionButtons from "./components/ActionButtons";
import ArchiveModelView from "./components/ArchiveModelView";
import { useFlowGraph } from "./hooks/useFlowGraph";
import { useFileUploads } from "./hooks/useFileUploads";
import { useArchiveModel } from "./hooks/useArchiveModel";
import { importNodes as importNodesApi, processGraph } from "./api/client";
import { positionImportedNodes } from "./utils/layout";
import { toGraphPayload } from "./utils/graphPayload";

const App = () => {
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onConnect } =
    useFlowGraph();
  const { wordFiles, excelFile, addWordFiles, removeWordFile, setExcelFile } =
    useFileUploads();
  const archive = useArchiveModel();
  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      alert(error instanceof Error ? error.message : "Ошибка при импорте узлов");
    } finally {
      setImporting(false);
    }
  };

  const startProcessing = async () => {
    if (!requireFiles() || !excelFile) {
      return;
    }
    setProcessing(true);
    try {
      const blob = await processGraph(
        toGraphPayload(nodes, edges),
        excelFile,
        wordFiles
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "archive.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error during processing:", error);
      alert(error instanceof Error ? error.message : "Ошибка при запуске");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="app-root">
      <div className="canvas-pane">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
      </div>

      <div className="controls-pane">
        <FileUploadPanel
          wordFiles={wordFiles}
          excelFile={excelFile}
          onAddWordFiles={addWordFiles}
          onRemoveWordFile={removeWordFile}
          onSelectExcel={setExcelFile}
        />

        <ActionButtons
          importing={importing}
          processing={processing}
          isGeneratingModel={archive.loading}
          hasNodes={nodes.length > 0}
          onImport={importNodes}
          onGenerateModel={() => archive.generate(nodes, edges)}
          onProcess={startProcessing}
        />

        {archive.visible && archive.archiveModel && (
          <ArchiveModelView model={archive.archiveModel} onClose={archive.hide} />
        )}
      </div>
    </div>
  );
};

export default App;
