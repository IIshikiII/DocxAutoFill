import type { AuthUser } from "../types";
import { useI18n } from "../i18n";
import LanguageSwitch from "./LanguageSwitch";

interface TopBarProps {
  dataOpen: boolean;
  onToggleData: () => void;
  onGenerateModel: () => void;
  onProcess: () => void;
  importing: boolean;
  processing: boolean;
  isGeneratingModel: boolean;
  hasNodes: boolean;
  user: AuthUser;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

const TopBar = ({
  dataOpen,
  onToggleData,
  onGenerateModel,
  onProcess,
  importing,
  processing,
  isGeneratingModel,
  hasNodes,
  user,
  onOpenAdmin,
  onLogout,
}: TopBarProps) => {
  const { t } = useI18n();
  const busy = importing || processing;

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-logo">📄</span>
        <span className="brand-name">DocxAutoFill</span>
      </div>

      <div className="toolbar">
        <button
          className={`btn ghost ${dataOpen ? "active" : ""}`}
          onClick={onToggleData}
          aria-pressed={dataOpen}
        >
          <span>📂</span>
          <span>{t("topbar.files")}</span>
        </button>

        <button
          className="btn"
          onClick={onGenerateModel}
          disabled={busy || !hasNodes || isGeneratingModel}
        >
          <span>
            {isGeneratingModel
              ? t("topbar.generatingModel")
              : t("topbar.generateModel")}
          </span>
          {isGeneratingModel && <span className="spinner" />}
        </button>

        <button
          className="btn primary"
          onClick={onProcess}
          disabled={busy || !hasNodes}
        >
          <span>{processing ? t("topbar.running") : t("topbar.run")}</span>
          {processing && <span className="spinner light" />}
        </button>
      </div>

      <div className="topbar-user">
        <LanguageSwitch />
        {user.role === "admin" && (
          <button className="btn ghost" onClick={onOpenAdmin} title={t("topbar.adminTitle")}>
            <span>👑</span>
            <span>{t("topbar.admin")}</span>
          </button>
        )}
        <div className="user-chip" title={t("topbar.loggedInAs", { name: user.username })}>
          <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
          <span className="user-name">{user.username}</span>
          <span className={`role-badge ${user.role}`}>
            {user.role === "admin" ? t("role.admin") : t("role.userShort")}
          </span>
        </div>
        <button className="icon-btn" onClick={onLogout} title={t("topbar.logout")} aria-label={t("topbar.logout")}>
          ⎋
        </button>
      </div>
    </header>
  );
};

export default TopBar;
