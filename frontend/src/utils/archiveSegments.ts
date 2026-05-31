import type { ArchiveSegment } from "../types";

/** The visible name: every segment shown as its current value (locks show the
 *  substituted Excel value, ext shows the extension). */
export function labelFromSegments(segments: ArchiveSegment[]): string {
  return segments.map((s) => s.value).join("");
}

/** The name *template*: locks emit their original `<…>` token so the backend
 *  re-applies the substitution; text and ext emit their literal value. */
export function templateFromSegments(segments: ArchiveSegment[]): string {
  return segments.map((s) => (s.kind === "lock" ? s.token : s.value)).join("");
}

/** Replace the value of the editable text segment at `index` (no-op otherwise). */
export function setTextSegment(
  segments: ArchiveSegment[],
  index: number,
  value: string
): ArchiveSegment[] {
  return segments.map((s, i) =>
    i === index && s.kind === "text" ? { ...s, value } : s
  );
}
