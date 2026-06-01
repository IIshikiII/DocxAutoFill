import ArchiveModelView from "./ArchiveModelView";
import SaveTemplateForm from "./SaveTemplateForm";
import type { ArchiveEditTarget, ArchiveItem } from "../types";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  const visible = open && model !== null;

  return (
    <aside
      className={`drawer right ${visible ? "" : "closed"}`}
      aria-hidden={!visible}
    >
      <div className="drawer-head">
        <h2 className="drawer-title">
          <span>🗂️</span> {t("archive.title")}
        </h2>
        <button className="icon-btn" onClick={onClose} title={t("common.close")}>
          ›
        </button>
      </div>

      <div className="drawer-body">
        {model && <ArchiveModelView model={model} onEdit={onEdit} />}
        <p className="hint">{t("archive.hint")}</p>
      </div>

      <div className="drawer-foot">
        <SaveTemplateForm busy={savingTemplate} onSave={onSaveTemplate} />
      </div>
    </aside>
  );
};

export default ArchivePanel;
