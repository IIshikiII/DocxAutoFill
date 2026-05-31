import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the action buttons on an empty canvas", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Импортировать" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Создать модель архива" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Запуск" })).toBeTruthy();
  });

  it("disables generate/run until nodes are imported", () => {
    render(<App />);
    const run = screen.getByRole("button", { name: "Запуск" });
    const generate = screen.getByRole("button", {
      name: "Создать модель архива",
    });
    expect((run as HTMLButtonElement).disabled).toBe(true);
    expect((generate as HTMLButtonElement).disabled).toBe(true);
  });
});
