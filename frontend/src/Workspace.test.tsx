import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Workspace from "./Workspace";
import type { AuthUser } from "./types";

vi.mock("./api/client", async (importActual) => {
  const actual = await importActual<typeof import("./api/client")>();
  return {
    ...actual,
    listTemplates: vi.fn().mockResolvedValue([]),
  };
});

const USER: AuthUser = { id: 1, username: "tester", role: "user", isActive: true };

describe("Workspace", () => {
  it("renders the action buttons on an empty canvas", () => {
    render(<Workspace user={USER} onLogout={() => {}} />);
    expect(screen.getByRole("button", { name: "Импортировать" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Создать модель архива" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Запуск" })).toBeTruthy();
  });

  it("disables generate/run until nodes are imported", () => {
    render(<Workspace user={USER} onLogout={() => {}} />);
    const run = screen.getByRole("button", { name: "Запуск" });
    const generate = screen.getByRole("button", {
      name: "Создать модель архива",
    });
    expect((run as HTMLButtonElement).disabled).toBe(true);
    expect((generate as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the admin button for admins only", () => {
    const admin: AuthUser = { ...USER, role: "admin" };
    const { rerender } = render(
      <Workspace user={USER} onLogout={() => {}} />
    );
    expect(screen.queryByRole("button", { name: /Админ/ })).toBeNull();
    rerender(<Workspace user={admin} onLogout={() => {}} />);
    expect(screen.getByRole("button", { name: /Админ/ })).toBeTruthy();
  });
});
