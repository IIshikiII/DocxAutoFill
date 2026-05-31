import { memo } from "react";
import { Position } from "@xyflow/react";
import CustomHandle from "../CustomHandle";
import { useNodeCategories } from "../../context/NodeCategoriesContext";
import {
  BLUE_PALETTE,
  categoryLabel,
  generateShade,
} from "../../utils/nodeColors";
import type { NodeComponentProps } from "../../types";

const BlueNode = ({ data, selected }: NodeComponentProps) => {
  const categories = useNodeCategories("blue");
  const category = data?.category || categories[0] || "default";
  const index = Math.max(categories.indexOf(category), 0);
  const shade = generateShade(BLUE_PALETTE, index, Math.max(categories.length, 1));

  return (
    <div
      className={`custom-node node-base blue-node ${selected ? "selected" : ""}`}
      style={{ background: shade.background, border: `1px solid ${shade.border}` }}
    >
      <div className="blue-node-label">{`${categoryLabel(category)}: ${
        data?.label || ""
      }`}</div>
      <CustomHandle type="target" position={Position.Right} connectionCount={1} />
    </div>
  );
};

export default memo(BlueNode);
