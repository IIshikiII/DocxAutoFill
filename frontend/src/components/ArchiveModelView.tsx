import TreeView from "react-treeview";
import "react-treeview/react-treeview.css";
import type { ArchiveItem } from "../types";

interface ArchiveModelViewProps {
  model: ArchiveItem;
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

const ArchiveModelView = ({ model }: ArchiveModelViewProps) => (
  <div className="archive-tree">{renderArchiveItem(model)}</div>
);

export default ArchiveModelView;
