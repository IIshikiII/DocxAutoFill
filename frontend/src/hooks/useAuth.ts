import { useCallback, useEffect, useState } from "react";
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
} from "../api/client";
import type { AuthUser } from "../types";

export type AuthStatus = "loading" | "authed" | "anon";

/** Session state restored from the httpOnly cookie on load (Stage 12).
 *  Because the cookie is sent automatically, a page reload re-authenticates
 *  via `/auth/me` without the user re-entering credentials. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    getMe()
      .then((u) => {
        if (!active) return;
        setUser(u);
        setStatus(u ? "authed" : "anon");
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus("anon");
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await loginApi(username, password);
    setUser(u);
    setStatus("authed");
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    setStatus("anon");
  }, []);

  return { user, status, login, logout };
}
