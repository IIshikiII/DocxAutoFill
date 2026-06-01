import { API_BASE_URL } from "../config";
import { translate } from "../i18n";
import type {
  AdminTemplate,
  AdminUser,
  ApplyTemplateResult,
  ArchiveItem,
  AuthUser,
  ConnectionTemplate,
  GraphPayload,
  ImportResponse,
  Role,
  WireNode,
} from "../types";

interface WireUser {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
}

function toAuthUser(u: WireUser): AuthUser {
  return {
    id: u.id,
    username: u.username,
    role: u.role as Role,
    isActive: u.is_active,
  };
}

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
  return translate("client.serverError", { status: res.status });
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
    credentials: "include",
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
    credentials: "include",
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
  const res = await fetch(`${API_BASE_URL}/api/templates`, {
    credentials: "include",
  });
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
    credentials: "include",
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
    credentials: "include",
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
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
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
    credentials: "include",
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
    credentials: "include",
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
  if (!result) throw new Error(translate("client.noArchive"));
  return result;
}

// --- Auth (Stage 12) ---------------------------------------------------------

/** Return the current user, or null if not authenticated (no error thrown). */
export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await errorDetail(res));
  return toAuthUser((await res.json()) as WireUser);
}

/** Log in with username + password; resolves with the user or throws. */
export async function login(
  username: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await errorDetail(res));
  return toAuthUser((await res.json()) as WireUser);
}

/** Log out the current session. */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// --- Admin: user management (Stage 12) ---------------------------------------

function toAdminUser(u: WireUser & { template_count: number }): AdminUser {
  return { ...toAuthUser(u), templateCount: u.template_count };
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorDetail(res));
  return ((await res.json()) as (WireUser & { template_count: number })[]).map(
    toAdminUser
  );
}

export async function createUser(
  username: string,
  password: string
): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await errorDetail(res));
  return toAdminUser((await res.json()) as WireUser & { template_count: number });
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorDetail(res));
}

export async function resetUserPassword(
  userId: number,
  password: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await errorDetail(res));
}

export async function listUserTemplates(
  userId: number
): Promise<AdminTemplate[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}/templates`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(await errorDetail(res));
  return ((await res.json()) as {
    id: number;
    name: string;
    connection_count: number;
  }[]).map((t) => ({
    id: t.id,
    name: t.name,
    connectionCount: t.connection_count,
  }));
}

export async function deleteUserTemplate(templateId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/templates/${templateId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorDetail(res));
}
