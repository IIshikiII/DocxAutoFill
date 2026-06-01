import type { AuthUser } from "../types";

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
          <span>Файлы</span>
        </button>

        <button
          className="btn"
          onClick={onGenerateModel}
          disabled={busy || !hasNodes || isGeneratingModel}
        >
          <span>{isGeneratingModel ? "Создание модели…" : "Создать модель архива"}</span>
          {isGeneratingModel && <span className="spinner" />}
        </button>

        <button
          className="btn primary"
          onClick={onProcess}
          disabled={busy || !hasNodes}
        >
          <span>{processing ? "Генерация…" : "Запуск"}</span>
          {processing && <span className="spinner light" />}
        </button>
      </div>

      <div className="topbar-user">
        {user.role === "admin" && (
          <button className="btn ghost" onClick={onOpenAdmin} title="Управление пользователями">
            <span>👑</span>
            <span>Админ</span>
          </button>
        )}
        <div className="user-chip" title={`Вы вошли как ${user.username}`}>
          <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
          <span className="user-name">{user.username}</span>
          <span className={`role-badge ${user.role}`}>
            {user.role === "admin" ? "админ" : "польз."}
          </span>
        </div>
        <button className="icon-btn" onClick={onLogout} title="Выйти" aria-label="Выйти">
          ⎋
        </button>
      </div>
    </header>
  );
};

export default TopBar;
