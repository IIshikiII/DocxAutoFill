import "./styles/app.css";

import LoginScreen from "./components/LoginScreen";
import Workspace from "./Workspace";
import { useAuth } from "./hooks/useAuth";

/** Auth gate: restores the session on load, then shows either the login screen
 *  or the workspace. The workspace is keyed by user id so switching accounts
 *  resets all canvas state. */
const App = () => {
  const { user, status, login, logout } = useAuth();

  if (status === "loading") {
    return (
      <div className="app-splash">
        <span className="spinner" />
        <span>Загрузка…</span>
      </div>
    );
  }

  if (status === "anon" || user === null) {
    return <LoginScreen onLogin={login} />;
  }

  return <Workspace key={user.id} user={user} onLogout={logout} />;
};

export default App;
