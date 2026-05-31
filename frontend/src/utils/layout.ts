import type { FlowNode, WireNode } from "../types";

const SPACING = 80;
const LEFT_COL_X = -60;
const BLUE_COL_X = 180;
const RIGHT_COL_X = 450;

/** Lay imported nodes into columns: violet (+ orange) on the left, blue in the
 *  middle, green on the right. Returns positioned canvas nodes. */
export function positionImportedNodes(source: WireNode[]): FlowNode[] {
  const violets = source.filter((n) => n.type === "violet");
  const orange = source.find((n) => n.type === "orange");
  const blues = source.filter((n) => n.type === "blue");
  const greens = source.filter((n) => n.type === "green");

  const positioned: FlowNode[] = violets.map((n, i) => ({
    ...n,
    position: { x: LEFT_COL_X, y: 40 + i * SPACING },
  }));

  if (orange) {
    positioned.push({
      ...orange,
      position: { x: LEFT_COL_X, y: 40 + violets.length * SPACING },
    });
  }

  positioned.push(
    ...blues.map((n, i) => ({
      ...n,
      position: { x: BLUE_COL_X, y: 40 + i * SPACING },
    })),
    ...greens.map((n, i) => ({
      ...n,
      position: { x: RIGHT_COL_X, y: 40 + i * SPACING },
    }))
  );

  return positioned;
}
