import { useCallback, useEffect, useState } from "react";
import {
  deleteTemplate,
  listTemplates,
  saveTemplate,
} from "../api/client";
import type { ConnectionTemplate, GraphPayload } from "../types";
import { useI18n } from "../i18n";

/** A transient status message shown next to the templates list. */
export interface TemplateNotice {
  kind: "ok" | "warn" | "err";
  text: string;
}

/** Connection-template library state: list, save and delete (Stage 11).
 *  Applying a template lives in the App because it mutates the canvas edges. */
export function useTemplates() {
  const { t } = useI18n();
  const [items, setItems] = useState<ConnectionTemplate[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<TemplateNotice | null>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await listTemplates());
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (name: string, graph: GraphPayload): Promise<boolean> => {
      setBusy(true);
      try {
        const saved = await saveTemplate(name, graph);
        await refresh();
        setNotice({
          kind: "ok",
          text: t("templates.saved", {
            name: saved.name,
            count: saved.connectionCount,
          }),
        });
        return true;
      } catch (error) {
        setNotice({
          kind: "err",
          text:
            error instanceof Error ? error.message : t("templates.saveFailed"),
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refresh, t]
  );

  const remove = useCallback(
    async (name: string) => {
      setBusy(true);
      try {
        await deleteTemplate(name);
        await refresh();
        setNotice({ kind: "ok", text: t("templates.deleted", { name }) });
      } catch (error) {
        setNotice({
          kind: "err",
          text:
            error instanceof Error ? error.message : t("templates.deleteFailed"),
        });
      } finally {
        setBusy(false);
      }
    },
    [refresh, t]
  );

  return { items, busy, notice, setNotice, refresh, save, remove };
}
