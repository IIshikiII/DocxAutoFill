import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFileUploads } from "./useFileUploads";

const file = (name: string) => new File(["x"], name);
const fileList = (...names: string[]) =>
  names.map(file) as unknown as FileList;

describe("useFileUploads", () => {
  it("appends word files across calls", () => {
    const { result } = renderHook(() => useFileUploads());

    act(() => result.current.addWordFiles(fileList("a.docx")));
    act(() => result.current.addWordFiles(fileList("b.docx", "c.docx")));

    expect(result.current.wordFiles.map((f) => f.name)).toEqual([
      "a.docx",
      "b.docx",
      "c.docx",
    ]);
  });

  it("ignores a null FileList", () => {
    const { result } = renderHook(() => useFileUploads());
    act(() => result.current.addWordFiles(null));
    expect(result.current.wordFiles).toEqual([]);
  });

  it("removes a word file by index", () => {
    const { result } = renderHook(() => useFileUploads());

    act(() => result.current.addWordFiles(fileList("a.docx", "b.docx")));
    act(() => result.current.removeWordFile(0));

    expect(result.current.wordFiles.map((f) => f.name)).toEqual(["b.docx"]);
  });

  it("tracks the selected excel file", () => {
    const { result } = renderHook(() => useFileUploads());

    act(() => result.current.setExcelFile(file("data.xlsx")));
    expect(result.current.excelFile?.name).toBe("data.xlsx");

    act(() => result.current.setExcelFile(null));
    expect(result.current.excelFile).toBeNull();
  });
});
