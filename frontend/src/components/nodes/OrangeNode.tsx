import { memo } from "react";
import { Position } from "@xyflow/react";
import CustomHandle from "../CustomHandle";
import type { NodeComponentProps } from "../../types";

const OrangeNode = ({ data, selected }: NodeComponentProps) => {
  return (
    <div
      className={`custom-node node-base orange-node ${selected ? "selected" : ""}`}
    >
      <div style={{ marginRight: 8 }}>
        {data?.label || "разбивать на папки"}
      </div>
      <CustomHandle type="target" position={Position.Right} connectionCount={1} />
    </div>
  );
};

export default memo(OrangeNode);
