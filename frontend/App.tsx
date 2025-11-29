import { useCallback, useEffect, useState } from "react";
import {
  Background,
  ReactFlow,
  addEdge,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import TreeView from "react-treeview";
import "react-treeview/react-treeview.css";

import "@xyflow/react/dist/style.css";

import GreenNode from "./GreenNode.jsx";
import BlueNode from "./BlueNode.jsx";
import VioletNode from "./VioletNode.jsx";
import OrangeNode from "./OrangeNode.jsx";
import mockGreen from "./api/greenNodes.json";
import mockBlue from "./api/blueNodes.json";
import mockViolet from "./api/violetNodes.json";
import mockOrange from "./api/orangeNode.json";

const nodeTypes = {
  green: GreenNode,
  blue: BlueNode,
  violet: VioletNode,
  orange: OrangeNode,
};

const CustomNodeFlow = () => {
  // start empty; nodes will be imported via button
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [wordFiles, setWordFiles] = useState<File[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  interface ArchiveItem {
    label: string;
    type: "folder" | "file";
    children?: ArchiveItem[];
  }
  const [archiveModel, setArchiveModel] = useState<ArchiveItem | null>(null);
  const [showArchiveModel, setShowArchiveModel] = useState(false);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);

  // validate connections and log them
  const onConnect = useCallback(
    (params: any) => {
      const sourceNode = nodes.find((n: any) => n.id === params.source);
      const targetNode = nodes.find((n: any) => n.id === params.target);

      console.log("Creating connection:", {
        source: {
          id: sourceNode?.id,
          type: sourceNode?.type,
          label: sourceNode?.data?.label,
        },
        target: {
          id: targetNode?.id,
          type: targetNode?.type,
          label: targetNode?.data?.label,
        },
      });

      // Проверяем синие узлы
      if (targetNode && targetNode.type === "blue") {
        const hasIncoming = edges.some((e: any) => e.target === params.target);
        if (hasIncoming) {
          return; // запрещаем повторные входящие соединения
        }
      }

      setEdges((eds: any) => {
        const newEdge = addEdge(params, eds);
        console.log("Updated edges:", newEdge);
        return newEdge;
      });
    },
    [setEdges, nodes, edges]
  );

  // delete selected green nodes (and their edges) or selected edges when Delete/Backspace is pressed
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // IDs of selected green nodes
        const selectedGreenIds = nodes
          .filter((n: any) => n.selected && n.type === "green")
          .map((n: any) => n.id);

        // If any green nodes selected -> delete them and any edges connected to them
        if (selectedGreenIds.length > 0) {
          setNodes((nds: any) =>
            nds.filter((n: any) => !selectedGreenIds.includes(n.id))
          );

          setEdges((eds: any) =>
            eds.filter(
              (edge: any) =>
                !selectedGreenIds.includes(edge.source) &&
                !selectedGreenIds.includes(edge.target) &&
                !edge.selected
            )
          );
          return;
        }

        // Otherwise delete selected edges as before
        setEdges((eds: any) => eds.filter((edge: any) => !edge.selected));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setEdges, setNodes, nodes]);

  const handleWordFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setWordFiles((prev) => [...prev, ...files]);
    }
  };

  const handleExcelFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setExcelFile(event.target.files[0]);
    }
  };

  const removeWordFile = (index: number) => {
    setWordFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderArchiveItem = (item: ArchiveItem) => {
    const icon = item.type === "folder" ? "📁" : "📄";
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.label}>
        <TreeView
          nodeLabel={
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{icon}</span>
              <span
                style={{
                  color: item.type === "folder" ? "#2c3e50" : "#7f8c8d",
                  fontWeight: item.type === "folder" ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            </span>
          }
          defaultCollapsed={false}
        >
          {hasChildren &&
            item.children?.map((child) => renderArchiveItem(child))}
        </TreeView>
      </div>
    );
  };

  const generateArchiveModel = async () => {
    setIsGeneratingModel(true);
    try {
      // Проверим, есть ли оранжевый узел и подключённые к нему зелёные узлы
      const orangeNode = nodes.find((n: any) => n.type === "orange");
      if (!orangeNode) {
        alert(
          'Не найден оранжевый узел ("разбивать на папки"). Пожалуйста, добавьте оранжевый узел.'
        );
        setIsGeneratingModel(false);
        return;
      }

      const greenConnections = edges.filter((edge: any) => {
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        return (
          (sourceNode?.type === "green" && targetNode?.id === orangeNode.id) ||
          (targetNode?.type === "green" && sourceNode?.id === orangeNode.id)
        );
      });

      if (greenConnections.length === 0) {
        alert(
          'Нужно соединение хотя бы одного зелёного узла с оранжевым узлом "разбивать на папки"'
        );
        setIsGeneratingModel(false);
        return;
      }

      // Формируем полезную нагрузку: узлы и связи
      const payload = {
        nodes: nodes.map(({ id, type, data }: any) => ({ id, type, data })),
        connections: edges.map(({ source, target }: any) => ({
          source,
          target,
        })),
      };

      console.log("Sending archive model request payload:", payload);

      // Попробуем отправить на бэкенд. Если бэкенда нет или он вернёт ошибку,
      // используем локальную заглушку в формате ожидаемой модели архива.
      let modelResponse: any = null;

      try {
        const res = await fetch("http://localhost:3000/api/archive-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          modelResponse = await res.json();
          console.log("Received archive model from backend:", modelResponse);
        } else {
          console.warn("Backend responded with status", res.status);
        }
      } catch (fetchErr) {
        console.warn("Failed to reach backend, using local stub:", fetchErr);
      }

      // Заглушка: формат должен соответствовать интерфейсу ArchiveItem
      const stubModel: ArchiveItem = {
        label: "Архив",
        type: "folder",
        children: [
          {
            label: "1_объединенные файлы",
            type: "folder",
            children: [],
          },
          // Пример папок для зелёных узлов — можно расширить
          ...(nodes
            .filter((n: any) => n.type === "green")
            .map((g: any) => ({
              label: g.data?.label || `green_${g.id}`,
              type: "folder",
              children: [
                {
                  label: `Пример файла для ${g.data?.label || g.id}`,
                  type: "file",
                },
              ],
            })) as ArchiveItem[]),
        ],
      };

      const finalModel = modelResponse || stubModel;
      setArchiveModel(finalModel);
      setShowArchiveModel(true);
    } catch (error) {
      console.error("Error generating archive model:", error);
      alert("Ошибка при создании модели архива");
    } finally {
      setIsGeneratingModel(false);
    }
  };

  const importNodes = async () => {
    if (!excelFile) {
      alert("Пожалуйста, прикрепите файл Excel");
      return;
    }
    if (wordFiles.length === 0) {
      alert("Пожалуйста, прикрепите хотя бы один файл Word");
      return;
    }

    setImporting(true);

    try {
      // Подготовка FormData для отправки файлов
      const formData = new FormData();
      // Excel отправляется под именем 'excel'
      formData.append("excel", excelFile);
      // Все Word-файлы отправляем под одним полем 'words[]' (массив)
      wordFiles.forEach((file) => {
        formData.append("words[]", file);
      });

      // Отправляем FormData на бэкенд и ждём списка узлов (заглушка)
      let serverResponse = null;
      try {
        const res = await fetch("http://localhost:3000/api/import-nodes", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          serverResponse = await res.json();
          console.log("Import nodes from backend:", serverResponse);
        } else {
          console.warn("Backend import responded with status", res.status);
        }
      } catch (err) {
        console.warn(
          "Failed to call backend import, falling back to local mocks:",
          err
        );
      }

      // Если сервер вернул узлы, используем их, иначе локальные мок-данные
      const sourceNodes = serverResponse?.nodes || [
        ...mockViolet,
        mockOrange,
        ...mockBlue,
        ...mockGreen,
      ];

      // Позиционирование узлов по типам
      const spacing = 80;
      const leftColX = -60;
      const blueColX = 180;
      const rightColX = 450;
      const violetX = 50;
      const orangeX = 50;

      const violets = sourceNodes.filter((n: any) => n.type === "violet");
      const orangeNode = sourceNodes.find((n: any) => n.type === "orange");
      const blues = sourceNodes.filter((n: any) => n.type === "blue");
      const greens = sourceNodes.filter((n: any) => n.type === "green");

      const leftNodes = [
        ...violets.map((n: any, i: number) => ({
          ...n,
          position: { x: leftColX, y: 40 + i * spacing },
        })),
      ];

      if (orangeNode) {
        leftNodes.push({
          ...orangeNode,
          position: { x: leftColX, y: 40 + violets.length * spacing },
        });
      }

      const blueNodes = blues.map((n: any, i: number) => ({
        ...n,
        position: { x: blueColX, y: 40 + i * spacing },
      }));
      const rightNodes = greens.map((n: any, i: number) => ({
        ...n,
        position: { x: rightColX, y: 40 + i * spacing },
      }));

      setNodes([...leftNodes, ...blueNodes, ...rightNodes]);
      window.nodes = [...leftNodes, ...blueNodes, ...rightNodes];
      setEdges(serverResponse?.edges || []);
    } catch (error) {
      console.error("Error importing nodes:", error);
      alert("Ошибка при импорте узлов");
    }

    setImporting(false);
  };

  const startProcessing = async () => {
    try {
      setProcessing(true);

      // Подготовим данные для отправки: узлы и их связи
      const payload = {
        nodes: nodes.map(({ id, type, data }: any) => ({ id, type, data })),
        connections: edges.map(({ source, target }: any) => ({
          source,
          target,
        })),
      };

      // Отправляем на бэкенд и ждём ответ
      const response = await fetch("http://localhost:3000/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const contentDisposition = response.headers.get("content-disposition");
        console.log("Response Headers:", Array.from(response.headers.entries())); // Debugging all headers

        if (contentDisposition !== null && contentDisposition.trim() !== "") {
          const isAttachment = contentDisposition.toLowerCase().includes("attachment");

          if (isAttachment) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            let filename = "archive.zip"; // fallback

            const encodedMatch = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
            if (encodedMatch && encodedMatch[1]) {
              filename = decodeURIComponent(encodedMatch[1].trim());
            } else {
              const simpleMatch = contentDisposition.match(/filename="([^"]+)"/i);
              if (simpleMatch && simpleMatch[1]) {
                filename = simpleMatch[1].trim();
              }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } else {
            console.warn("Content-Disposition does not indicate attachment:", contentDisposition);
          }
        } else {
          console.error("Content-Disposition header is missing or empty. Cannot download file.");
        }
      } else {
        console.error("Failed to process request, status:", response.status);
      }
    } catch (error) {
      console.error("Error during processing:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* top half: canvas */}
      <div style={{ height: "50vh", borderBottom: "1px solid #ddd" }}>
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
      </div>

      {/* bottom half: controls */}
      <div
        style={{
          height: "50vh",
          display: "flex",
          justifyContent: "space-between",
          padding: "20px",
          position: "relative",
        }}
      >
        {/* Left side: File inputs section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            width: "500px",
            alignSelf: "flex-start",
          }}
        >
          {/* Word files */}
          <div
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>Файлы Word</h3>
            <input
              id="wordInput"
              type="file"
              accept=".doc,.docx,.DOC,.DOCX"
              onChange={handleWordFiles}
              multiple
              style={{ display: "none" }}
            />
            <label htmlFor="wordInput" className="file-upload-btn">
              📎 Выбрать файлы
            </label>

            {wordFiles.length > 0 && (
              <div className="file-list">
                {wordFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-meta">
                      <div className="file-icon">📄</div>
                      <div className="file-name">{file.name}</div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeWordFile(index)}
                      title="Удалить файл"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Excel file */}
          <div
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>Файл Excel</h3>
            <input
              id="excelInput"
              type="file"
              accept=".xls,.xlsx,.XLS,.XLSX"
              onChange={handleExcelFile}
              style={{ display: "none" }}
            />
            <label htmlFor="excelInput" className="file-upload-btn primary">
              📊 Выбрать Excel
            </label>

            {excelFile && (
              <div className="file-list">
                <div className="file-item">
                  <div className="file-meta">
                    <div className="file-icon">📈</div>
                    <div className="file-name">{excelFile.name}</div>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => setExcelFile(null)}
                    title="Удалить файл"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignSelf: "center",
          }}
        >
          <button
            onClick={importNodes}
            disabled={importing || processing}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              opacity: importing || processing ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>{importing ? "Импортирование..." : "Импортировать"}</span>
            {importing && (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid #000000",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
          </button>

          <button
            onClick={generateArchiveModel}
            disabled={
              importing || processing || nodes.length === 0 || isGeneratingModel
            }
            style={{
              padding: "10px 20px",
              fontSize: 16,
              opacity:
                importing ||
                processing ||
                nodes.length === 0 ||
                isGeneratingModel
                  ? 0.7
                  : 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>
              {isGeneratingModel
                ? "Создание модели..."
                : "Создать модель архива"}
            </span>
            {isGeneratingModel && (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid #000000",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
          </button>

          <button
            onClick={startProcessing}
            disabled={processing || importing || nodes.length === 0}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              opacity: processing || importing || nodes.length === 0 ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>Запуск</span>
            {processing && (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid #ffffff",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
          </button>
        </div>

        {/* Center: Archive Model Display */}
        {showArchiveModel && archiveModel && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: "20px",
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #ddd",
              maxHeight: "300px",
              overflowY: "auto",
              minWidth: "300px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                marginBottom: "15px",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                Модель архива
              </span>
              <button
                onClick={() => setShowArchiveModel(false)}
                style={{
                  float: "right",
                  border: "none",
                  background: "none",
                  color: "#666",
                  cursor: "pointer",
                  padding: "5px",
                  borderRadius: "3px",
                }}
              >
                ✕
              </button>
            </div>
            <div className="archive-tree">
              {renderArchiveItem(archiveModel)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .archive-tree {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .archive-tree .tree-view {
          margin-bottom: 5px;
        }

        .archive-tree .tree-view_item {
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .archive-tree .tree-view_item:hover {
          background-color: #f8f9fa;
        }

        .archive-tree .tree-view_children {
          margin-left: 25px;
        }

        .archive-tree .tree-view_arrow {
          display: none; /* Скрываем треугольники */
        }

        .archive-tree .tree-view_children {
          margin-left: 25px; /* Сохраняем отступ для вложенных элементов */
          padding-left: 0; /* Убираем дополнительный отступ */
        }

        /* File upload UI */
        .file-upload-btn {
          display: inline-block;
          padding: 8px 12px;
          background: #f0f3f7;
          border: 1px solid #d0d7df;
          border-radius: 6px;
          cursor: pointer;
          color: #1f2937;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .file-upload-btn:hover {
          background: #e7edf3;
        }

        .file-upload-btn.primary {
          background: linear-gradient(180deg,#3b82f6,#2563eb);
          color: #fff;
          border: none;
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: #fbfdff;
          border: 1px solid #e6eef8;
          border-radius: 8px;
        }

        .file-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .file-icon {
          font-size: 18px;
        }

        .file-name {
          color: #0f172a;
          font-size: 14px;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .remove-btn:hover {
          background: rgba(239,68,68,0.08);
        }

        /* Node hover/selection styling */
        .custom-node {
          transition: filter 120ms ease, box-shadow 120ms ease;
        }

        /* Slightly darker on hover for all nodes */
        .custom-node:hover {
          filter: brightness(0.95);
        }

        /* Slightly stronger shadow when hovered */
        .custom-node:hover {
          box-shadow: 0 4px 14px rgba(16,24,40,0.08);
        }

        /* For green nodes when selected make them a bit darker */
        .green-node.selected {
          filter: brightness(0.86) !important;
          box-shadow: 0 6px 20px rgba(34,197,94,0.12);
        }

        /* Green node base styling (moved from inline) */
        .green-node {
          padding: 8px;
          border-radius: 6px;
          background: #b7e4c7;
          border: 1px solid #4caf50;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default CustomNodeFlow;

declare global {
  interface Window {
    nodes: any[];
  }
}
