import { useState } from "react";
import "@xyflow/react/dist/style.css";
import "./styles/app.css";

import FlowCanvas from "./components/FlowCanvas";
import TopBar from "./components/TopBar";
import DataPanel from "./components/DataPanel";
import ArchivePanel from "./components/ArchivePanel";
import ProgressOverlay from "./components/ProgressOverlay";
import { useFlowGraph } from "./hooks/useFlowGraph";
import { useFileUploads } from "./hooks/useFileUploads";
import { useArchiveModel } from "./hooks/useArchiveModel";
import { useProcessing } from "./hooks/useProcessing";
import { importNodes as importNodesApi } from "./api/client";
import { positionImportedNodes } from "./utils/layout";

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
  const { processing, progress, run } = useProcessing();
  const [importing, setImporting] = useState(false);
  const [dataOpen, setDataOpen] = useState(true);

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

  const startProcessing = () => {
    if (!requireFiles() || !excelFile) {
      return;
    }
    void run(nodes, edges, excelFile, wordFiles);
  };

  return (
    <div className="app">
      <TopBar
        dataOpen={dataOpen}
        onToggleData={() => setDataOpen((open) => !open)}
        onGenerateModel={() => archive.generate(nodes, edges)}
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
          onConnect={onConnect}
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
        />

        <ArchivePanel
          open={archive.visible}
          model={archive.archiveModel}
          onClose={archive.hide}
        />

        {progress && <ProgressOverlay progress={progress} />}
      </div>
    </div>
  );
};

export default App;
