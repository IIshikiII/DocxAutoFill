import FileUploadPanel from "./FileUploadPanel";

interface DataPanelProps {
  open: boolean;
  onClose: () => void;
  wordFiles: File[];
  excelFile: File | null;
  onAddWordFiles: (files: FileList | null) => void;
  onRemoveWordFile: (index: number) => void;
  onSelectExcel: (file: File | null) => void;
  importing: boolean;
  processing: boolean;
  onImport: () => void;
}

const DataPanel = ({
  open,
  onClose,
  wordFiles,
  excelFile,
  onAddWordFiles,
  onRemoveWordFile,
  onSelectExcel,
  importing,
  processing,
  onImport,
}: DataPanelProps) => {
  return (
    <aside className={`drawer left ${open ? "" : "closed"}`} aria-hidden={!open}>
      <div className="drawer-head">
        <h2 className="drawer-title">
          <span>📂</span> Данные
        </h2>
        <button className="icon-btn" onClick={onClose} title="Свернуть панель">
          ‹
        </button>
      </div>

      <div className="drawer-body">
        <FileUploadPanel
          wordFiles={wordFiles}
          excelFile={excelFile}
          onAddWordFiles={onAddWordFiles}
          onRemoveWordFile={onRemoveWordFile}
          onSelectExcel={onSelectExcel}
        />
      </div>

      <div className="drawer-foot">
        <button
          className="btn primary block"
          onClick={onImport}
          disabled={importing || processing}
        >
          <span>{importing ? "Импортирование…" : "Импортировать"}</span>
          {importing && <span className="spinner light" />}
        </button>
        <p className="hint">
          Загрузите таблицу и шаблоны, затем импортируйте узлы на холст.
        </p>
      </div>
    </aside>
  );
};

export default DataPanel;
