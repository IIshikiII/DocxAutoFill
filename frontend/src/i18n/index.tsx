import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Locale } from "./translations";

export type { Locale } from "./translations";
export { LOCALES, LOCALE_LABELS } from "./translations";

const STORAGE_KEY = "docxautofill_locale";
const FALLBACK: Locale = "ru";

export type TranslateParams = Record<string, string | number>;

function readInitialLocale(): Locale {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ru" || saved === "en") return saved;
  }
  return FALLBACK;
}

// Module-level current locale so non-React callers (utils, api client) can
// translate too. Kept in sync by `setLocale` below.
let currentLocale: Locale = readInitialLocale();

/** Translate a key with optional `{param}` interpolation. Falls back to the
 *  default locale, then to the raw key, so a missing string is never fatal. */
export function translate(
  key: string,
  params?: TranslateParams,
  locale: Locale = currentLocale
): string {
  const table = translations[locale] ?? translations[FALLBACK];
  let text = table[key] ?? translations[FALLBACK][key] ?? key;
  if (params) {
    for (const name in params) {
      text = text.split(`{${name}}`).join(String(params[name]));
    }
  }
  return text;
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);

  const setLocale = useCallback((next: Locale) => {
    currentLocale = next;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
    setLocaleState(next);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // `t` identity changes only when the locale changes, so consumers re-render
  // exactly once on switch and never on unrelated updates.
  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(key, params, locale),
    [locale]
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
