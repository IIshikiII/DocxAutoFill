import { createContext, useContext } from "react";
import type { NodeType } from "../types";

/** Category names present on the canvas, grouped by node type. Used by blue and
 *  violet nodes to pick a consistent shade per category without a global. */
export type CategoriesByType = Partial<Record<NodeType, string[]>>;

const NodeCategoriesContext = createContext<CategoriesByType>({});

export const NodeCategoriesProvider = NodeCategoriesContext.Provider;

/** Read the ordered list of categories for a node type (empty if none). */
export function useNodeCategories(type: NodeType): string[] {
  return useContext(NodeCategoriesContext)[type] ?? [];
}
