import { useState } from "react";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

/** Full-screen, branded sign-in form shown when no session is active. */
const LoginScreen = ({ onLogin }: LoginScreenProps) => {
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
      setError(err instanceof Error ? err.message : "Не удалось войти");
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-aurora" aria-hidden="true" />
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="login-logo">📄</span>
          <span className="login-title">DocxAutoFill</span>
        </div>
        <p className="login-subtitle">Войдите, чтобы продолжить</p>

        <label className="login-field">
          <span>Логин</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ваш логин"
            autoFocus
            disabled={busy}
          />
        </label>

        <label className="login-field">
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ваш пароль"
            disabled={busy}
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="btn primary block login-submit" disabled={!canSubmit}>
          <span>{busy ? "Вход…" : "Войти"}</span>
          {busy && <span className="spinner light" />}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
