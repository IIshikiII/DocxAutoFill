import { useEffect, useState } from "react";
import TreeView from "react-treeview";
import "react-treeview/react-treeview.css";
import type {
  ArchiveEdit,
  ArchiveEditTarget,
  ArchiveItem,
  ArchiveSegment,
} from "../types";
import {
  labelFromSegments,
  setTextSegment,
  templateFromSegments,
} from "../utils/archiveSegments";
import { useI18n } from "../i18n";

interface ArchiveModelViewProps {
  model: ArchiveItem;
  /** Called with the reconstructed name template whenever an editable name changes. */
  onEdit: (target: ArchiveEditTarget, template: string) => void;
}

function targetMatches(a: ArchiveEditTarget, b: ArchiveEditTarget): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if ("nodeId" in a && "nodeId" in b) {
    return a.nodeId === b.nodeId;
  }
  return true;
}

/** Find the first editable item's segments matching `target` (read-only lookup). */
function findSegments(
  item: ArchiveItem,
  target: ArchiveEditTarget
): ArchiveSegment[] | null {
  if (item.edit && targetMatches(item.edit.target, target)) {
    return item.edit.segments;
  }
  for (const child of item.children ?? []) {
    const found = findSegments(child, target);
    if (found) {
      return found;
    }
  }
  return null;
}

/** Update the text segment at `index` on every item matching `target`. Each
 *  matching item keeps its own frozen segments (lock value, extension). */
function updateMatching(
  item: ArchiveItem,
  target: ArchiveEditTarget,
  index: number,
  value: string
): ArchiveItem {
  let next = item;
  if (item.edit && targetMatches(item.edit.target, target)) {
    const segments = setTextSegment(item.edit.segments, index, value);
    next = {
      ...item,
      label: labelFromSegments(segments),
      edit: { ...item.edit, segments },
    };
  }
  if (next.children) {
    next = {
      ...next,
      children: next.children.map((c) =>
        updateMatching(c, target, index, value)
      ),
    };
  }
  return next;
}

const SegmentedName = ({
  edit,
  onText,
}: {
  edit: ArchiveEdit;
  onText: (target: ArchiveEditTarget, index: number, value: string) => void;
}) => {
  const { t } = useI18n();
  return (
  <span className="seg-editor">
    {edit.segments.map((seg, i) => {
      if (seg.kind === "text") {
        return (
          <input
            key={i}
            className="seg-text nodrag"
            value={seg.value}
            size={Math.max(seg.value.length, 1)}
            spellCheck={false}
            onChange={(e) => onText(edit.target, i, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        );
      }
      if (seg.kind === "lock") {
        return (
          <span
            key={i}
            className="seg-chip seg-lock"
            title={t("archiveView.lockTitle")}
          >
            {seg.value}
          </span>
        );
      }
      return (
        <span
          key={i}
          className="seg-chip seg-ext"
          title={t("archiveView.extTitle")}
        >
          {seg.value}
        </span>
      );
    })}
  </span>
  );
};

const ArchiveModelView = ({ model, onEdit }: ArchiveModelViewProps) => {
  const [tree, setTree] = useState<ArchiveItem>(model);
  useEffect(() => setTree(model), [model]);

  const editText = (
    target: ArchiveEditTarget,
    index: number,
    value: string
  ) => {
    setTree((prev) => updateMatching(prev, target, index, value));
    const segments = findSegments(tree, target);
    if (segments) {
      onEdit(
        target,
        templateFromSegments(setTextSegment(segments, index, value))
      );
    }
  };

  const renderItem = (item: ArchiveItem, path: string) => {
    const icon = item.type === "folder" ? "📁" : "📄";
    const hasChildren = (item.children?.length ?? 0) > 0;

    const label = (
      <span className="archive-item-label">
        <span>{icon}</span>
        {item.edit ? (
          <SegmentedName edit={item.edit} onText={editText} />
        ) : (
          <span className={`archive-item-name ${item.type}`}>{item.label}</span>
        )}
      </span>
    );

    return (
      <div key={path}>
        <TreeView nodeLabel={label} defaultCollapsed={false}>
          {hasChildren &&
            item.children?.map((child, i) => renderItem(child, `${path}-${i}`))}
        </TreeView>
      </div>
    );
  };

  return <div className="archive-tree">{renderItem(tree, "root")}</div>;
};

export default ArchiveModelView;
