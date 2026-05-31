interface ActionButtonsProps {
  importing: boolean;
  processing: boolean;
  isGeneratingModel: boolean;
  hasNodes: boolean;
  onImport: () => void;
  onGenerateModel: () => void;
  onProcess: () => void;
}

const ActionButtons = ({
  importing,
  processing,
  isGeneratingModel,
  hasNodes,
  onImport,
  onGenerateModel,
  onProcess,
}: ActionButtonsProps) => {
  return (
    <div className="action-column">
      <button
        className="action-btn"
        onClick={onImport}
        disabled={importing || processing}
      >
        <span>{importing ? "Импортирование..." : "Импортировать"}</span>
        {importing && <div className="spinner" />}
      </button>

      <button
        className="action-btn"
        onClick={onGenerateModel}
        disabled={importing || processing || !hasNodes || isGeneratingModel}
      >
        <span>
          {isGeneratingModel ? "Создание модели..." : "Создать модель архива"}
        </span>
        {isGeneratingModel && <div className="spinner" />}
      </button>

      <button
        className="action-btn"
        onClick={onProcess}
        disabled={processing || importing || !hasNodes}
      >
        <span>Запуск</span>
        {processing && <div className="spinner light" />}
      </button>
    </div>
  );
};

export default ActionButtons;
