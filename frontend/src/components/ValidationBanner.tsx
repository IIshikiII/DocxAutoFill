import type { GraphValidationError } from "../utils/graphValidation";

interface Props {
  errors: GraphValidationError[];
  onDismiss: () => void;
}

const ValidationBanner = ({ errors, onDismiss }: Props) => {
  if (errors.length === 0) return null;

  return (
    <div className="validation-banner" role="alert">
      <div className="validation-banner-inner">
        <span className="validation-icon" aria-hidden="true">⚠</span>
        <div className="validation-content">
          <strong className="validation-title">Граф неполный</strong>
          <ul className="validation-list">
            {errors.map((e) => (
              <li key={e.nodeId}>{e.message}</li>
            ))}
          </ul>
        </div>
        <button
          className="icon-btn validation-close"
          onClick={onDismiss}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ValidationBanner;
