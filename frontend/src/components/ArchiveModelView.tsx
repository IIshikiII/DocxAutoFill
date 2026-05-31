import TreeView from "react-treeview";
import "react-treeview/react-treeview.css";
import type { ArchiveItem } from "../types";

interface ArchiveModelViewProps {
  model: ArchiveItem;
  onClose: () => void;
}

const renderArchiveItem = (item: ArchiveItem) => {
  const icon = item.type === "folder" ? "📁" : "📄";
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div key={item.label}>
      <TreeView
        nodeLabel={
          <span className="archive-item-label">
            <span>{icon}</span>
            <span
              className={`archive-item-name ${
                item.type === "folder" ? "folder" : "file"
              }`}
            >
              {item.label}
            </span>
          </span>
        }
        defaultCollapsed={false}
      >
        {hasChildren && item.children?.map((child) => renderArchiveItem(child))}
      </TreeView>
    </div>
  );
};

const ArchiveModelView = ({ model, onClose }: ArchiveModelViewProps) => {
  return (
    <div className="archive-model-panel">
      <div className="archive-model-header">
        <span className="archive-model-title">Модель архива</span>
        <button className="archive-model-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="archive-tree">{renderArchiveItem(model)}</div>
    </div>
  );
};

export default ArchiveModelView;
