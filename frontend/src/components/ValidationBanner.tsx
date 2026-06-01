import type { GraphValidationError } from "../utils/graphValidation";
import { useI18n } from "../i18n";

interface Props {
  errors: GraphValidationError[];
  onDismiss: () => void;
}

const ValidationBanner = ({ errors, onDismiss }: Props) => {
  const { t } = useI18n();
  if (errors.length === 0) return null;

  return (
    <div className="validation-banner" role="alert">
      <div className="validation-banner-inner">
        <span className="validation-icon" aria-hidden="true">⚠</span>
        <div className="validation-content">
          <strong className="validation-title">{t("validation.title")}</strong>
          <ul className="validation-list">
            {errors.map((e) => (
              <li key={e.nodeId}>{t(e.messageKey, { label: e.label })}</li>
            ))}
          </ul>
        </div>
        <button
          className="icon-btn validation-close"
          onClick={onDismiss}
          aria-label={t("common.close")}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ValidationBanner;
