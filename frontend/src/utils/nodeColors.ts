import type { FlowNode, NodeType } from "../types";

/** An HSL palette anchor for a node family (hue + saturation are fixed,
 *  lightness varies per category index). */
export interface ShadePalette {
  hue: number;
  saturation: number;
}

/** Background + border colors for a single node. */
export interface NodeShade {
  background: string;
  border: string;
}

export const BLUE_PALETTE: ShadePalette = { hue: 210, saturation: 90 };
export const VIOLET_PALETTE: ShadePalette = { hue: 270, saturation: 70 };

/** Produce a shade for category `index` of `total` categories: lighter shades
 *  for the first categories, darker for the last. */
export function generateShade(
  palette: ShadePalette,
  index: number,
  total: number
): NodeShade {
  const lightness = 85 - index * (30 / Math.max(total - 1, 1));
  return {
    background: `hsl(${palette.hue}, ${palette.saturation}%, ${lightness}%)`,
    border: `hsl(${palette.hue}, ${palette.saturation}%, ${Math.max(
      lightness - 20,
      20
    )}%)`,
  };
}

/** Distinct, defined category names of all nodes of the given type, in first-seen order. */
export function uniqueCategories(nodes: FlowNode[], type: NodeType): string[] {
  return [
    ...new Set(
      nodes
        .filter((node) => node.type === type)
        .map((node) => node.data?.category)
        .filter((category): category is string => Boolean(category))
    ),
  ];
}

/** Capitalize the first letter of a category for display. */
export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
