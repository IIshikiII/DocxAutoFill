import { LOCALES, LOCALE_LABELS, useI18n } from "../i18n";

/** Compact RU/EN segmented toggle for the interface language. */
const LanguageSwitch = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t("lang.switch")}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-option ${locale === code ? "active" : ""}`}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitch;
