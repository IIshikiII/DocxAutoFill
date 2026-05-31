import { describe, expect, it } from "vitest";
import {
  labelFromSegments,
  setTextSegment,
  templateFromSegments,
} from "./archiveSegments";
import type { ArchiveSegment } from "../types";

const segments: ArchiveSegment[] = [
  { kind: "text", value: "tpl " },
  { kind: "lock", value: "ФИО", token: "<название>" },
  { kind: "ext", value: ".docx" },
];

describe("archiveSegments", () => {
  it("shows the substituted value in the visible label", () => {
    expect(labelFromSegments(segments)).toBe("tpl ФИО.docx");
  });

  it("restores the placeholder token in the template", () => {
    expect(templateFromSegments(segments)).toBe("tpl <название>.docx");
  });

  it("edits only the targeted text segment, leaving locks/ext frozen", () => {
    const edited = setTextSegment(segments, 0, "Диплом ");
    expect(labelFromSegments(edited)).toBe("Диплом ФИО.docx");
    expect(templateFromSegments(edited)).toBe("Диплом <название>.docx");
  });

  it("ignores attempts to edit a non-text (frozen) segment", () => {
    expect(setTextSegment(segments, 1, "hacked")).toEqual(segments);
    expect(setTextSegment(segments, 2, ".pdf")).toEqual(segments);
  });
});
