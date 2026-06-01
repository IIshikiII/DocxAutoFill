import { useState } from "react";
import { useI18n } from "../i18n";

interface SaveTemplateFormProps {
  busy: boolean;
  /** Returns whether the save succeeded (so the form can clear on success). */
  onSave: (name: string) => Promise<boolean>;
}

/** Inline form to save the current connections as a named template. Shown in
 *  the archive-model drawer, so it only appears once a model has been built —
 *  by then the graph is valid and the connections are worth keeping. */
const SaveTemplateForm = ({ busy, onSave }: SaveTemplateFormProps) => {
  const { t } = useI18n();
  const [name, setName] = useState("");

  const trimmed = name.trim();

  const submit = async () => {
    if (!trimmed || busy) return;
    const ok = await onSave(trimmed);
    if (ok) setName("");
  };

  return (
    <div className="save-tpl">
      <h3 className="save-tpl-title">🔗 {t("saveTpl.title")}</h3>
      <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
        {t("saveTpl.hint")}
      </p>
      <div className="save-tpl-row">
        <input
          className="save-tpl-input"
          type="text"
          value={name}
          placeholder={t("saveTpl.placeholder")}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          disabled={busy}
        />
        <button
          className="btn primary"
          onClick={() => void submit()}
          disabled={busy || trimmed.length === 0}
        >
          <span>{t("common.save")}</span>
          {busy && <span className="spinner light" />}
        </button>
      </div>
    </div>
  );
};

export default SaveTemplateForm;
