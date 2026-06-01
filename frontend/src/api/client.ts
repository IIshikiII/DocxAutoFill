import { API_BASE_URL } from "../config";
import type {
  ApplyTemplateResult,
  ArchiveItem,
  ConnectionTemplate,
  GraphPayload,
  ImportResponse,
  WireNode,
} from "../types";

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

/** List saved connection templates (Stage 11). */
export async function listTemplates(): Promise<ConnectionTemplate[]> {
  const res = await fetch(`${API_BASE_URL}/api/templates`);
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  const body = (await res.json()) as {
    templates: { name: string; connection_count: number }[];
  };
  return body.templates.map((t) => ({
    name: t.name,
    connectionCount: t.connection_count,
  }));
}

/** Save the current graph's connections as a named template. */
export async function saveTemplate(
  name: string,
  graph: GraphPayload
): Promise<ConnectionTemplate> {
  const res = await fetch(`${API_BASE_URL}/api/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, graph }),
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  const body = (await res.json()) as { name: string; connection_count: number };
  return { name: body.name, connectionCount: body.connection_count };
}

/** Resolve a saved template against the current nodes into concrete edges. */
export async function applyTemplate(
  name: string,
  nodes: WireNode[]
): Promise<ApplyTemplateResult> {
  const res = await fetch(`${API_BASE_URL}/api/templates/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, nodes }),
  });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
  return (await res.json()) as ApplyTemplateResult;
}

/** Delete a saved template by name. */
export async function deleteTemplate(name: string): Promise<void> {
  const url = `${API_BASE_URL}/api/templates?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await errorDetail(res));
  }
}

/** Run generation and get the resulting archive as a Blob (non-streaming). */
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

/** Progress tick reported by the streaming process endpoint. */
export interface ProcessProgress {
  done: number;
  total: number;
  percent: number;
  message: string;
}

function decodeBase64Zip(data: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/zip" });
}

function parseSseFrame(frame: string): { event: string; data: string } {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice("data:".length).trim();
    }
  }
  return { event, data };
}

/**
 * Run generation while receiving live progress via Server-Sent Events.
 * Calls `onProgress` for each tick and resolves with the archive Blob.
 */
export async function processGraphStream(
  graph: GraphPayload,
  excel: File,
  words: File[],
  onProgress: (progress: ProcessProgress) => void
): Promise<Blob> {
  const form = new FormData();
  appendFiles(form, excel, words);
  form.append("graph", JSON.stringify(graph));

  const res = await fetch(`${API_BASE_URL}/api/process/stream`, {
    method: "POST",
    body: form,
  });
  if (!res.ok || !res.body) {
    throw new Error(await errorDetail(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Blob | null = null;
  let failure: string | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const { event, data } = parseSseFrame(frame);
      if (!data) continue;
      const payload = JSON.parse(data);

      if (event === "progress") {
        onProgress(payload as ProcessProgress);
      } else if (event === "done") {
        result = decodeBase64Zip(payload.data as string);
      } else if (event === "error") {
        failure = payload.detail as string;
      }
    }
  }

  if (failure) throw new Error(failure);
  if (!result) throw new Error("Сервер не вернул архив");
  return result;
}
