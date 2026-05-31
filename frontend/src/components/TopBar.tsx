interface TopBarProps {
  dataOpen: boolean;
  onToggleData: () => void;
  onGenerateModel: () => void;
  onProcess: () => void;
  importing: boolean;
  processing: boolean;
  isGeneratingModel: boolean;
  hasNodes: boolean;
}

const TopBar = ({
  dataOpen,
  onToggleData,
  onGenerateModel,
  onProcess,
  importing,
  processing,
  isGeneratingModel,
  hasNodes,
}: TopBarProps) => {
  const busy = importing || processing;

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-logo">📄</span>
        <span className="brand-name">DocxAutoFill</span>
      </div>

      <div className="toolbar">
        <button
          className={`btn ghost ${dataOpen ? "active" : ""}`}
          onClick={onToggleData}
          aria-pressed={dataOpen}
        >
          <span>📂</span>
          <span>Файлы</span>
        </button>

        <button
          className="btn"
          onClick={onGenerateModel}
          disabled={busy || !hasNodes || isGeneratingModel}
        >
          <span>{isGeneratingModel ? "Создание модели…" : "Создать модель архива"}</span>
          {isGeneratingModel && <span className="spinner" />}
        </button>

        <button
          className="btn primary"
          onClick={onProcess}
          disabled={busy || !hasNodes}
        >
          <span>{processing ? "Генерация…" : "Запуск"}</span>
          {processing && <span className="spinner light" />}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
