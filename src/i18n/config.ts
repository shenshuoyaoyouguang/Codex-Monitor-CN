import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import zh from "./locales/zh";

export const SUPPORTED_LOCALES = ["en", "zh"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isValidLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    ...(import.meta.env.DEV
      ? {
          saveMissing: true,
          missingKeyHandler: (lngs: readonly string[], _ns: string, key: string) => {
            console.warn(`[i18n] Missing translation key: "${key}" for locale: ${lngs.join(", ")}`);
          },
        }
      : {}),
  });

export default i18n;
