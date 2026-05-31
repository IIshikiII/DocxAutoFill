import { memo } from "react";
import { Position } from "@xyflow/react";
import CustomHandle from "../CustomHandle";
import { useNodeCategories } from "../../context/NodeCategoriesContext";
import {
  VIOLET_PALETTE,
  categoryLabel,
  generateShade,
} from "../../utils/nodeColors";
import type { NodeComponentProps } from "../../types";

const VioletNode = ({ data, selected }: NodeComponentProps) => {
  const categories = useNodeCategories("violet");
  const category = data?.category || categories[0] || "default";
  const index = Math.max(categories.indexOf(category), 0);
  const shade = generateShade(
    VIOLET_PALETTE,
    index,
    Math.max(categories.length, 1)
  );

  return (
    <div className="violet-node-wrapper">
      <div className="violet-node-category">{categoryLabel(category)}</div>
      <div
        className={`custom-node node-base violet-node ${selected ? "selected" : ""}`}
        style={{
          background: shade.background,
          border: `1px solid ${shade.border}`,
        }}
      >
        {data?.label || ""}
        <CustomHandle
          type="target"
          position={Position.Right}
          connectionCount={1}
        />
      </div>
    </div>
  );
};

export default memo(VioletNode);
