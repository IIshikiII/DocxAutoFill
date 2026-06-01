import ArchiveModelView from "./ArchiveModelView";
import SaveTemplateForm from "./SaveTemplateForm";
import type { ArchiveEditTarget, ArchiveItem } from "../types";

interface ArchivePanelProps {
  open: boolean;
  model: ArchiveItem | null;
  onClose: () => void;
  onEdit: (target: ArchiveEditTarget, template: string) => void;
  savingTemplate: boolean;
  onSaveTemplate: (name: string) => Promise<boolean>;
}

const ArchivePanel = ({
  open,
  model,
  onClose,
  onEdit,
  savingTemplate,
  onSaveTemplate,
}: ArchivePanelProps) => {
  const visible = open && model !== null;

  return (
    <aside
      className={`drawer right ${visible ? "" : "closed"}`}
      aria-hidden={!visible}
    >
      <div className="drawer-head">
        <h2 className="drawer-title">
          <span>🗂️</span> Модель архива
        </h2>
        <button className="icon-btn" onClick={onClose} title="Закрыть">
          ›
        </button>
      </div>

      <div className="drawer-body">
        {model && <ArchiveModelView model={model} onEdit={onEdit} />}
        <p className="hint">
          Редактируйте имена прямо в дереве. Подсвеченные части (из Excel) и
          расширение файлов изменить нельзя. Имя объединённого файла по
          умолчанию содержит имя макета и редактируется целиком (кроме
          расширения).
        </p>
      </div>

      <div className="drawer-foot">
        <SaveTemplateForm busy={savingTemplate} onSave={onSaveTemplate} />
      </div>
    </aside>
  );
};

export default ArchivePanel;
