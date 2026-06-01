import { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import {
  deleteUserTemplate,
  listUserTemplates,
} from "../api/client";
import type { AdminTemplate, AdminUser } from "../types";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  currentUserId: number;
}

/** Admin-only modal: create users, reset passwords, delete users and inspect
 *  (and prune) each user's saved connection templates (Stage 12). */
const AdminPanel = ({ open, onClose, currentUserId }: AdminPanelProps) => {
  const admin = useAdmin(open);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetFor, setResetFor] = useState<number | null>(null);
  const [resetPass, setResetPass] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [templates, setTemplates] = useState<Record<number, AdminTemplate[]>>({});

  if (!open) return null;

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.trim() || newPass.length === 0) return;
    const ok = await admin.create(newUser.trim(), newPass);
    if (ok) {
      setNewUser("");
      setNewPass("");
    }
  };

  const submitReset = async (user: AdminUser) => {
    if (resetPass.length === 0) return;
    const ok = await admin.resetPassword(user, resetPass);
    if (ok) {
      setResetFor(null);
      setResetPass("");
    }
  };

  const toggleTemplates = async (user: AdminUser) => {
    if (expanded === user.id) {
      setExpanded(null);
      return;
    }
    setExpanded(user.id);
    if (!(user.id in templates)) {
      const list = await listUserTemplates(user.id);
      setTemplates((prev) => ({ ...prev, [user.id]: list }));
    }
  };

  const removeTemplate = async (user: AdminUser, template: AdminTemplate) => {
    await deleteUserTemplate(template.id);
    const list = await listUserTemplates(user.id);
    setTemplates((prev) => ({ ...prev, [user.id]: list }));
    void admin.refresh();
  };

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <div className="admin-head">
          <h2 className="drawer-title">
            <span>👑</span> Управление пользователями
          </h2>
          <button className="icon-btn" onClick={onClose} title="Закрыть">
            ×
          </button>
        </div>

        <div className="admin-body">
          <form className="admin-create" onSubmit={submitCreate}>
            <h3 className="admin-section-title">Новый пользователь</h3>
            <div className="admin-create-row">
              <input
                className="admin-input"
                placeholder="Логин"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                disabled={admin.busy}
              />
              <input
                className="admin-input"
                type="password"
                placeholder="Пароль (мин. 8)"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                disabled={admin.busy}
              />
              <button
                className="btn primary"
                disabled={admin.busy || !newUser.trim() || newPass.length === 0}
              >
                Создать
              </button>
            </div>
          </form>

          {admin.notice && (
            <div className={`tpl-notice ${admin.notice.kind}`}>
              <span>{admin.notice.text}</span>
              <button
                className="tpl-notice-close"
                onClick={() => admin.setNotice(null)}
                aria-label="Скрыть"
              >
                ×
              </button>
            </div>
          )}

          <h3 className="admin-section-title">Пользователи</h3>
          {admin.loading ? (
            <p className="hint">Загрузка…</p>
          ) : (
            <ul className="admin-user-list">
              {admin.users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <li key={user.id} className="admin-user">
                    <div className="admin-user-row">
                      <div className="admin-user-meta">
                        <span className="admin-user-name">{user.username}</span>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === "admin" ? "админ" : "пользователь"}
                        </span>
                        {isSelf && <span className="admin-self">это вы</span>}
                      </div>
                      <div className="admin-user-actions">
                        <button
                          className="btn tpl-apply"
                          onClick={() => toggleTemplates(user)}
                        >
                          Шаблоны ({user.templateCount})
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            setResetFor(resetFor === user.id ? null : user.id);
                            setResetPass("");
                          }}
                          disabled={admin.busy}
                        >
                          Пароль
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Удалить пользователя «${user.username}» и все его шаблоны?`
                              )
                            ) {
                              void admin.remove(user);
                            }
                          }}
                          disabled={admin.busy || isSelf}
                          title={isSelf ? "Нельзя удалить себя" : "Удалить пользователя"}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    {resetFor === user.id && (
                      <div className="admin-reset">
                        <input
                          className="admin-input"
                          type="password"
                          placeholder="Новый пароль (мин. 8)"
                          value={resetPass}
                          onChange={(e) => setResetPass(e.target.value)}
                          disabled={admin.busy}
                        />
                        <button
                          className="btn primary"
                          onClick={() => void submitReset(user)}
                          disabled={admin.busy || resetPass.length === 0}
                        >
                          Сменить
                        </button>
                      </div>
                    )}

                    {expanded === user.id && (
                      <div className="admin-templates">
                        {!(user.id in templates) ? (
                          <p className="hint">Загрузка…</p>
                        ) : templates[user.id].length === 0 ? (
                          <p className="hint">Нет сохранённых шаблонов.</p>
                        ) : (
                          <ul className="tpl-list">
                            {templates[user.id].map((t) => (
                              <li key={t.id} className="tpl-item">
                                <div className="tpl-meta">
                                  <span className="tpl-name">{t.name}</span>
                                  <span className="tpl-count">
                                    {t.connectionCount} связей
                                  </span>
                                </div>
                                <button
                                  className="remove-btn"
                                  onClick={() => void removeTemplate(user, t)}
                                  title="Удалить шаблон"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
