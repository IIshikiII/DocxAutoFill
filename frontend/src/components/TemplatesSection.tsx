import type { ConnectionTemplate } from "../types";
import type { TemplateNotice } from "../hooks/useTemplates";

interface TemplatesSectionProps {
  items: ConnectionTemplate[];
  busy: boolean;
  notice: TemplateNotice | null;
  /** Whether nodes are on the canvas (templates can only be applied then). */
  canApply: boolean;
  onApply: (name: string) => void;
  onDelete: (name: string) => void;
  onDismissNotice: () => void;
}

/** The connection-template library: pick a saved template and apply it to the
 *  freshly imported nodes, or delete templates you no longer need (Stage 11). */
const TemplatesSection = ({
  items,
  busy,
  notice,
  canApply,
  onApply,
  onDelete,
  onDismissNotice,
}: TemplatesSectionProps) => {
  return (
    <div className="upload-card tpl-section">
      <h3>🔗 Шаблоны связей</h3>

      {notice && (
        <div className={`tpl-notice ${notice.kind}`}>
          <span>{notice.text}</span>
          <button
            className="tpl-notice-close"
            onClick={onDismissNotice}
            aria-label="Скрыть"
          >
            ×
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="hint" style={{ marginTop: 4 }}>
          Шаблонов пока нет. Соедините узлы, создайте модель архива и сохраните
          связи как шаблон — потом его можно будет применить к новому импорту.
        </p>
      ) : (
        <>
          <ul className="tpl-list">
            {items.map((tpl) => (
              <li key={tpl.name} className="tpl-item">
                <div className="tpl-meta">
                  <span className="tpl-name" title={tpl.name}>
                    {tpl.name}
                  </span>
                  <span className="tpl-count">{tpl.connectionCount} связей</span>
                </div>
                <div className="tpl-actions">
                  <button
                    className="btn tpl-apply"
                    onClick={() => onApply(tpl.name)}
                    disabled={busy || !canApply}
                    title={
                      canApply
                        ? "Расставить связи по шаблону"
                        : "Сначала импортируйте узлы"
                    }
                  >
                    Применить
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => onDelete(tpl.name)}
                    disabled={busy}
                    title="Удалить шаблон"
                    aria-label={`Удалить шаблон ${tpl.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {!canApply && (
            <p className="hint" style={{ marginTop: 8 }}>
              Импортируйте узлы, чтобы применить шаблон.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default TemplatesSection;
