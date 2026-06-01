import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./api/client", async (importActual) => {
  const actual = await importActual<typeof import("./api/client")>();
  return {
    ...actual,
    getMe: vi.fn().mockResolvedValue(null),
    listTemplates: vi.fn().mockResolvedValue([]),
  };
});

describe("App auth gate", () => {
  it("shows the login screen when not authenticated", async () => {
    render(<App />);
    expect(
      await screen.findByRole("button", { name: "Войти" })
    ).toBeTruthy();
  });
});
