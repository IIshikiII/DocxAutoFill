import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Workspace from "./Workspace";
import { I18nProvider } from "./i18n";
import type { AuthUser } from "./types";

vi.mock("./api/client", async (importActual) => {
  const actual = await importActual<typeof import("./api/client")>();
  return {
    ...actual,
    listTemplates: vi.fn().mockResolvedValue([]),
  };
});

const USER: AuthUser = { id: 1, username: "tester", role: "user", isActive: true };

const renderWorkspace = (user: AuthUser = USER) =>
  render(
    <I18nProvider>
      <Workspace user={user} onLogout={() => {}} />
    </I18nProvider>
  );

describe("Workspace", () => {
  it("renders the action buttons on an empty canvas", () => {
    renderWorkspace();
    expect(screen.getByRole("button", { name: "Импортировать" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Создать модель архива" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Запуск" })).toBeTruthy();
  });

  it("disables generate/run until nodes are imported", () => {
    renderWorkspace();
    const run = screen.getByRole("button", { name: "Запуск" });
    const generate = screen.getByRole("button", {
      name: "Создать модель архива",
    });
    expect((run as HTMLButtonElement).disabled).toBe(true);
    expect((generate as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the admin button for admins only", () => {
    const { rerender } = renderWorkspace(USER);
    expect(screen.queryByRole("button", { name: /Админ/ })).toBeNull();
    rerender(
      <I18nProvider>
        <Workspace user={{ ...USER, role: "admin" }} onLogout={() => {}} />
      </I18nProvider>
    );
    expect(screen.getByRole("button", { name: /Админ/ })).toBeTruthy();
  });
});
