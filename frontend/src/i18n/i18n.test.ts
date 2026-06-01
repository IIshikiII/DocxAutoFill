import { describe, expect, it } from "vitest";
import { translate } from "./index";
import { translations } from "./translations";

describe("translate", () => {
  it("returns the string for the requested locale", () => {
    expect(translate("login.submit", undefined, "ru")).toBe("Войти");
    expect(translate("login.submit", undefined, "en")).toBe("Sign in");
  });

  it("interpolates named params", () => {
    expect(translate("topbar.loggedInAs", { name: "bob" }, "en")).toBe(
      "Signed in as bob"
    );
    expect(
      translate("templates.connections", { count: 3 }, "en")
    ).toBe("3 connections");
  });

  it("falls back to the raw key when missing", () => {
    expect(translate("nonexistent.key", undefined, "en")).toBe("nonexistent.key");
  });

  it("keeps RU and EN dictionaries in sync (same keys)", () => {
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(enKeys).toEqual(ruKeys);
  });
});
