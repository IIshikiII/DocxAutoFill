declare module "react-treeview" {
  import type { ReactNode } from "react";

  interface TreeViewProps {
    nodeLabel: ReactNode;
    defaultCollapsed?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
    itemClassName?: string;
    treeViewClassName?: string;
    children?: ReactNode;
  }

  const TreeView: (props: TreeViewProps) => JSX.Element;
  export default TreeView;
}
