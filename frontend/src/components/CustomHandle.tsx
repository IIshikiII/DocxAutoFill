import { Handle, useNodeConnections } from "@xyflow/react";
import type { HandleProps } from "@xyflow/react";

type CustomHandleProps = HandleProps & { connectionCount: number };

/** A Handle that stops accepting connections once `connectionCount` is reached. */
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
