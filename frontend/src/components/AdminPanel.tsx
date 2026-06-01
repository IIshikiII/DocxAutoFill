import { useState } from "react";
import { useAdmin } from "../hooks/useAdmin";
import {
  deleteUserTemplate,
  listUserTemplates,
} from "../api/client";
import type { AdminTemplate, AdminUser } from "../types";
import { useI18n } from "../i18n";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  currentUserId: number;
}

/** Admin-only modal: create users, reset passwords, delete users and inspect
 *  (and prune) each user's saved connection templates (Stage 12). */
const AdminPanel = ({ open, onClose, currentUserId }: AdminPanelProps) => {
  const { t } = useI18n();
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
            <span>👑</span> {t("topbar.adminTitle")}
          </h2>
          <button className="icon-btn" onClick={onClose} title={t("common.close")}>
            ×
          </button>
        </div>

        <div className="admin-body">
          <form className="admin-create" onSubmit={submitCreate}>
            <h3 className="admin-section-title">{t("admin.newUser")}</h3>
            <div className="admin-create-row">
              <input
                className="admin-input"
                placeholder={t("admin.login")}
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                disabled={admin.busy}
              />
              <input
                className="admin-input"
                type="password"
                placeholder={t("admin.password8")}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                disabled={admin.busy}
              />
              <button
                className="btn primary"
                disabled={admin.busy || !newUser.trim() || newPass.length === 0}
              >
                {t("admin.create")}
              </button>
            </div>
          </form>

          {admin.notice && (
            <div className={`tpl-notice ${admin.notice.kind}`}>
              <span>{admin.notice.text}</span>
              <button
                className="tpl-notice-close"
                onClick={() => admin.setNotice(null)}
                aria-label={t("common.hide")}
              >
                ×
              </button>
            </div>
          )}

          <h3 className="admin-section-title">{t("admin.users")}</h3>
          {admin.loading ? (
            <p className="hint">{t("common.loading")}</p>
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
                          {user.role === "admin" ? t("role.admin") : t("role.user")}
                        </span>
                        {isSelf && <span className="admin-self">{t("admin.you")}</span>}
                      </div>
                      <div className="admin-user-actions">
                        <button
                          className="btn tpl-apply"
                          onClick={() => toggleTemplates(user)}
                        >
                          {t("admin.templatesBtn", { count: user.templateCount })}
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            setResetFor(resetFor === user.id ? null : user.id);
                            setResetPass("");
                          }}
                          disabled={admin.busy}
                        >
                          {t("admin.passwordBtn")}
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                t("admin.confirmDelete", { name: user.username })
                              )
                            ) {
                              void admin.remove(user);
                            }
                          }}
                          disabled={admin.busy || isSelf}
                          title={isSelf ? t("admin.cantDeleteSelf") : t("admin.deleteUserTitle")}
                        >
                          {t("admin.deleteBtn")}
                        </button>
                      </div>
                    </div>

                    {resetFor === user.id && (
                      <div className="admin-reset">
                        <input
                          className="admin-input"
                          type="password"
                          placeholder={t("admin.newPassword8")}
                          value={resetPass}
                          onChange={(e) => setResetPass(e.target.value)}
                          disabled={admin.busy}
                        />
                        <button
                          className="btn primary"
                          onClick={() => void submitReset(user)}
                          disabled={admin.busy || resetPass.length === 0}
                        >
                          {t("admin.changeBtn")}
                        </button>
                      </div>
                    )}

                    {expanded === user.id && (
                      <div className="admin-templates">
                        {!(user.id in templates) ? (
                          <p className="hint">{t("common.loading")}</p>
                        ) : templates[user.id].length === 0 ? (
                          <p className="hint">{t("admin.noTemplates")}</p>
                        ) : (
                          <ul className="tpl-list">
                            {templates[user.id].map((tpl) => (
                              <li key={tpl.id} className="tpl-item">
                                <div className="tpl-meta">
                                  <span className="tpl-name">{tpl.name}</span>
                                  <span className="tpl-count">
                                    {t("templates.connections", {
                                      count: tpl.connectionCount,
                                    })}
                                  </span>
                                </div>
                                <button
                                  className="remove-btn"
                                  onClick={() => void removeTemplate(user, tpl)}
                                  title={t("templates.deleteTitle")}
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
