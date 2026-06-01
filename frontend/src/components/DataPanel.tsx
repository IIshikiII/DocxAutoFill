import FileUploadPanel from "./FileUploadPanel";
import TemplatesSection from "./TemplatesSection";
import { useI18n } from "../i18n";
import type { ConnectionTemplate } from "../types";
import type { TemplateNotice } from "../hooks/useTemplates";

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
  templates: ConnectionTemplate[];
  templatesBusy: boolean;
  templateNotice: TemplateNotice | null;
  canApplyTemplate: boolean;
  onApplyTemplate: (name: string) => void;
  onDeleteTemplate: (name: string) => void;
  onDismissTemplateNotice: () => void;
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
  templates,
  templatesBusy,
  templateNotice,
  canApplyTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  onDismissTemplateNotice,
}: DataPanelProps) => {
  const { t } = useI18n();
  return (
    <aside className={`drawer left ${open ? "" : "closed"}`} aria-hidden={!open}>
      <div className="drawer-head">
        <h2 className="drawer-title">
          <span>📂</span> {t("data.title")}
        </h2>
        <button className="icon-btn" onClick={onClose} title={t("data.collapse")}>
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

        <TemplatesSection
          items={templates}
          busy={templatesBusy}
          notice={templateNotice}
          canApply={canApplyTemplate}
          onApply={onApplyTemplate}
          onDelete={onDeleteTemplate}
          onDismissNotice={onDismissTemplateNotice}
        />
      </div>

      <div className="drawer-foot">
        <button
          className="btn primary block"
          onClick={onImport}
          disabled={importing || processing}
        >
          <span>{importing ? t("data.importing") : t("data.import")}</span>
          {importing && <span className="spinner light" />}
        </button>
        <p className="hint">{t("data.hint")}</p>
      </div>
    </aside>
  );
};

export default DataPanel;
