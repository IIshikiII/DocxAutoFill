import { useState } from "react";

/** Word + Excel file selection state for the upload panel. */
export function useFileUploads() {
  const [wordFiles, setWordFiles] = useState<File[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const addWordFiles = (files: FileList | null) => {
    if (files) {
      setWordFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeWordFile = (index: number) => {
    setWordFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    wordFiles,
    excelFile,
    addWordFiles,
    removeWordFile,
    setExcelFile,
  };
}
