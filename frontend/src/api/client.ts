import { API_BASE_URL } from "../config";
import type { ArchiveItem, GraphPayload, ImportResponse } from "../types";

/** Extract a human-readable error message from a failed response. */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // not JSON — fall through to status text
  }
  return `Ошибка сервера (${res.status})`;
}

function appendFiles(form: FormData, excel: File, words: File[]): void {
  form.append("excel", excel);
  words.forEach((file) => form.append("words[]", file));
}

/** Upload Excel + Word templates and get the initial canvas nodes. */
export async function importNodes(
  excel: File,
  words: File[]
): Promise<ImportResponse> {
  const form = new FormData();
  appendFiles(form, excel, words);

  const res = await fetch(`${API_BASE_URL}/api/import-nodes`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  return (await res.json()) as ImportResponse;
}

/** Get the archive folder/file preview tree for the current graph. */
export async function getArchiveModel(
  graph: GraphPayload
): Promise<ArchiveItem> {
  const res = await fetch(`${API_BASE_URL}/api/archive-model`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(graph),
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  return (await res.json()) as ArchiveItem;
}

/** Run generation and get the resulting archive as a Blob. */
export async function processGraph(
  graph: GraphPayload,
  excel: File,
  words: File[]
): Promise<Blob> {
  const form = new FormData();
  appendFiles(form, excel, words);
  form.append("graph", JSON.stringify(graph));

  const res = await fetch(`${API_BASE_URL}/api/process`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  return res.blob();
}
