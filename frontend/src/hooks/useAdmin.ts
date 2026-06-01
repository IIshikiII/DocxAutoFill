import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
} from "../api/client";
import type { AdminUser } from "../types";
import { useI18n } from "../i18n";

export interface AdminNotice {
  kind: "ok" | "err";
  text: string;
}

/** Admin user-management state: load, create, delete, reset password. */
export function useAdmin(active: boolean) {
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch (error) {
      setNotice({
        kind: "err",
        text: error instanceof Error ? error.message : t("admin.loadUsersFailed"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (active) void refresh();
  }, [active, refresh]);

  const create = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setBusy(true);
      try {
        const created = await createUser(username, password);
        await refresh();
        setNotice({ kind: "ok", text: t("admin.userCreated", { name: created.username }) });
        return true;
      } catch (error) {
        setNotice({
          kind: "err",
          text: error instanceof Error ? error.message : t("admin.createFailed"),
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refresh, t]
  );

  const remove = useCallback(
    async (user: AdminUser) => {
      setBusy(true);
      try {
        await deleteUser(user.id);
        await refresh();
        setNotice({ kind: "ok", text: t("admin.userDeleted", { name: user.username }) });
      } catch (error) {
        setNotice({
          kind: "err",
          text: error instanceof Error ? error.message : t("admin.deleteFailed"),
        });
      } finally {
        setBusy(false);
      }
    },
    [refresh, t]
  );

  const resetPassword = useCallback(
    async (user: AdminUser, password: string): Promise<boolean> => {
      setBusy(true);
      try {
        await resetUserPassword(user.id, password);
        setNotice({ kind: "ok", text: t("admin.passwordChanged", { name: user.username }) });
        return true;
      } catch (error) {
        setNotice({
          kind: "err",
          text: error instanceof Error ? error.message : t("admin.passwordFailed"),
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t]
  );

  return { users, loading, busy, notice, setNotice, refresh, create, remove, resetPassword };
}
