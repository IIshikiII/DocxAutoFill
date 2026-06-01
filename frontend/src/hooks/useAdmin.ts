import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
} from "../api/client";
import type { AdminUser } from "../types";

export interface AdminNotice {
  kind: "ok" | "err";
  text: string;
}

/** Admin user-management state: load, create, delete, reset password. */
export function useAdmin(active: boolean) {
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
        text: error instanceof Error ? error.message : "Не удалось загрузить пользователей",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) void refresh();
  }, [active, refresh]);

  const create = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setBusy(true);
      try {
        const created = await createUser(username, password);
        await refresh();
        setNotice({ kind: "ok", text: `Пользователь «${created.username}» создан` });
        return true;
      } catch (error) {
        setNotice({
          kind: "err",
          text: error instanceof Error ? error.message : "Не удалось создать пользователя",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (user: AdminUser) => {
      setBusy(true);
      try {
        await deleteUser(user.id);
        await refresh();
        setNotice({ kind: "ok", text: `Пользователь «${user.username}» удалён` });
      } catch (error) {
        setNotice({
          kind: "err",
          text: error instanceof Error ? error.message : "Не удалось удалить пользователя",
        });
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const resetPassword = useCallback(
    async (user: AdminUser, password: string): Promise<boolean> => {
      setBusy(true);
      try {
        await resetUserPassword(user.id, password);
        setNotice({ kind: "ok", text: `Пароль пользователя «${user.username}» изменён` });
        return true;
      } catch (error) {
        setNotice({
          kind: "err",
          text: error instanceof Error ? error.message : "Не удалось сменить пароль",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  return { users, loading, busy, notice, setNotice, refresh, create, remove, resetPassword };
}
