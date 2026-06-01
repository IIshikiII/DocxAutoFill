import { useState } from "react";
import LanguageSwitch from "./LanguageSwitch";
import { useI18n } from "../i18n";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

/** Full-screen, branded sign-in form shown when no session is active. */
const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-aurora" aria-hidden="true" />
      <div className="login-lang">
        <LanguageSwitch />
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="login-logo">📄</span>
          <span className="login-title">DocxAutoFill</span>
        </div>
        <p className="login-subtitle">{t("login.subtitle")}</p>

        <label className="login-field">
          <span>{t("login.username")}</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("login.usernamePh")}
            autoFocus
            disabled={busy}
          />
        </label>

        <label className="login-field">
          <span>{t("login.password")}</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordPh")}
            disabled={busy}
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="btn primary block login-submit" disabled={!canSubmit}>
          <span>{busy ? t("login.submitting") : t("login.submit")}</span>
          {busy && <span className="spinner light" />}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
