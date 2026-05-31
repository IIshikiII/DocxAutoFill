import React, { memo } from "react";
import { Position } from "@xyflow/react";
import CustomHandle from "./CustomHandle";

const OrangeNode = ({ data, selected }) => {
  return (
    <div
      className={`custom-node orange-node ${selected ? "selected" : ""}`}
      style={{
        padding: 8,
        borderRadius: 6,
        background: "#ffe0b2",
        border: "2px solid #ff9800",
        display: "flex",
        alignItems: "center",
        fontWeight: 600,
      }}
    >
      <div style={{ marginRight: 8 }}>
        {data?.label || "разбивать на папки"}
      </div>
      <CustomHandle
        type="target"
        position={Position.Right}
        connectionCount={1}
      />
    </div>
  );
};

export default memo(OrangeNode);
