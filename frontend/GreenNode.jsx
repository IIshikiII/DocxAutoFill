import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

const GreenNode = ({ data, selected }) => {
  return (
    <div className={`custom-node green-node ${selected ? "selected" : ""}`}>
      <Handle type="source" position={Position.Left} />
      <div style={{ fontWeight: 600, marginLeft: 8 }}>
        {data?.label || "Green"}
      </div>
    </div>
  );
};

export default memo(GreenNode);
