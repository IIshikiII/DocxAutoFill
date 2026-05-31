import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeComponentProps } from "../../types";

const GreenNode = ({ data, selected }: NodeComponentProps) => {
  return (
    <div
      className={`custom-node node-base green-node ${selected ? "selected" : ""}`}
    >
      <Handle type="source" position={Position.Left} />
      <div style={{ fontWeight: 600, marginLeft: 8 }}>
        {data?.label || "Green"}
      </div>
    </div>
  );
};

export default memo(GreenNode);
