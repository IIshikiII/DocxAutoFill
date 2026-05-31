interface FileUploadPanelProps {
  wordFiles: File[];
  excelFile: File | null;
  onAddWordFiles: (files: FileList | null) => void;
  onRemoveWordFile: (index: number) => void;
  onSelectExcel: (file: File | null) => void;
}

const FileUploadPanel = ({
  wordFiles,
  excelFile,
  onAddWordFiles,
  onRemoveWordFile,
  onSelectExcel,
}: FileUploadPanelProps) => {
  return (
    <div className="upload-stack">
      {/* Word files */}
      <div className="upload-card">
        <h3>Шаблоны Word</h3>
        <input
          id="wordInput"
          type="file"
          accept=".doc,.docx,.DOC,.DOCX"
          onChange={(e) => onAddWordFiles(e.target.files)}
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
                  onClick={() => onRemoveWordFile(index)}
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
      <div className="upload-card">
        <h3>Таблица Excel</h3>
        <input
          id="excelInput"
          type="file"
          accept=".xls,.xlsx,.XLS,.XLSX"
          onChange={(e) => onSelectExcel(e.target.files?.[0] ?? null)}
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
                onClick={() => onSelectExcel(null)}
                title="Удалить файл"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadPanel;
