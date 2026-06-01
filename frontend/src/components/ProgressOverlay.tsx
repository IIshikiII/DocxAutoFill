import type { ProcessProgress } from "../api/client";
import { useI18n } from "../i18n";

interface ProgressOverlayProps {
  progress: ProcessProgress;
}

const ProgressOverlay = ({ progress }: ProgressOverlayProps) => {
  const { t } = useI18n();
  return (
    <div className="overlay">
      <div className="progress-card">
        <div className="progress-spark">⚡</div>
        <h3 className="progress-title">{t("progress.title")}</h3>
        <div className={`progress-phase progress-phase--${progress.phase}`}>
          {t(progress.phase === "merge" ? "progress.phaseMerge" : "progress.phaseFill")}
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="progress-meta">
          <span className="progress-percent">{progress.percent}%</span>
          <span className="progress-message">{progress.message}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverlay;
