import React from "react";
import { Handle, useNodeConnections } from "@xyflow/react";
import type { HandleProps } from "@xyflow/react";

type CustomHandleProps = HandleProps & { connectionCount: number };

const CustomHandle = (props: CustomHandleProps) => {
  const connections = useNodeConnections({
    handleType: props.type,
  });

  return (
    <Handle
      {...props}
      isConnectable={connections.length < props.connectionCount}
    />
  );
};

export default CustomHandle;
