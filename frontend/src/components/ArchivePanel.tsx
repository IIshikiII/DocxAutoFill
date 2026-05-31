import ArchiveModelView from "./ArchiveModelView";
import type { ArchiveItem } from "../types";

interface ArchivePanelProps {
  open: boolean;
  model: ArchiveItem | null;
  onClose: () => void;
}

const ArchivePanel = ({ open, model, onClose }: ArchivePanelProps) => {
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
        {model && <ArchiveModelView model={model} />}
      </div>
    </aside>
  );
};

export default ArchivePanel;
