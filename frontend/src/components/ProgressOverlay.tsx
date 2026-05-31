import type { ProcessProgress } from "../api/client";

interface ProgressOverlayProps {
  progress: ProcessProgress;
}

const ProgressOverlay = ({ progress }: ProgressOverlayProps) => {
  return (
    <div className="overlay">
      <div className="progress-card">
        <div className="progress-spark">⚡</div>
        <h3 className="progress-title">Генерация документов</h3>
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
