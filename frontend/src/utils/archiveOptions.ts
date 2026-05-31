import type { ArchiveOptions, WireArchiveOptions } from "../types";

/** Defaults mirror the backend config fallbacks (see backend/src/config.py). */
export const DEFAULT_ARCHIVE_OPTIONS: ArchiveOptions = {
  mergedDirName: "1_объединенные файлы",
  mergedFileTemplate: "Объединённый_<файл>.docx",
};

/** Convert UI archive options to the snake_case wire shape sent to the backend. */
export function toWireOptions(options: ArchiveOptions): WireArchiveOptions {
  return {
    merged_dir_name: options.mergedDirName,
    merged_file_template: options.mergedFileTemplate,
  };
}
