import { vi } from "vitest";

type TranslationValue =
  | string
  | ((options?: Record<string, unknown>) => string);

export type TranslationMap = Record<string, TranslationValue>;

function resolveTranslation(
  value: TranslationValue,
  options?: Record<string, unknown>,
) {
  if (typeof value === "function") {
    return value(options);
  }
  if (!options) {
    return value;
  }
  return value.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    String(options[key] ?? ""),
  );
}

export function createTranslationFn(translations: TranslationMap = {}) {
  return (key: string, options?: Record<string, unknown>) => {
    if (typeof options?.count === "number") {
      const pluralKey = `${key}_${options.count === 1 ? "one" : "other"}`;
      if (pluralKey in translations) {
        return resolveTranslation(translations[pluralKey], options);
      }
    }
    if (key in translations) {
      return resolveTranslation(translations[key], options);
    }
    return key;
  };
}

export function createI18nMock(
  translations: TranslationMap = {},
  language = "en",
) {
  const t = createTranslationFn(translations);
  const i18n = {
    language,
    changeLanguage: vi.fn(async (nextLanguage: string) => {
      i18n.language = nextLanguage;
      return nextLanguage;
    }),
    t,
  };
  return i18n;
}

export function createI18nModuleMock(
  translations: TranslationMap = {},
  language = "en",
) {
  return {
    default: createI18nMock(translations, language),
  };
}

export function createReactI18nextMock(
  translations: TranslationMap = {},
  language = "en",
) {
  const i18n = createI18nMock(translations, language);
  return {
    useTranslation: () => ({
      t: i18n.t,
      i18n,
    }),
    initReactI18next: {
      type: "3rdParty" as const,
      init: vi.fn(),
      use: () => ({ init: vi.fn() }),
    },
  };
}
