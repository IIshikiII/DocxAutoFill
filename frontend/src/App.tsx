import "./styles/app.css";

import LoginScreen from "./components/LoginScreen";
import Workspace from "./Workspace";
import { useAuth } from "./hooks/useAuth";
import { I18nProvider, useI18n } from "./i18n";

/** Auth gate: restores the session on load, then shows either the login screen
 *  or the workspace. The workspace is keyed by user id so switching accounts
 *  resets all canvas state. */
const Gate = () => {
  const { user, status, login, logout } = useAuth();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <div className="app-splash">
        <span className="spinner" />
        <span>{t("common.loading")}</span>
      </div>
    );
  }

  if (status === "anon" || user === null) {
    return <LoginScreen onLogin={login} />;
  }

  return <Workspace key={user.id} user={user} onLogout={logout} />;
};

const App = () => (
  <I18nProvider>
    <Gate />
  </I18nProvider>
);

export default App;
