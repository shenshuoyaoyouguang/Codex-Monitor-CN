import i18n from "@/i18n";

function resolveLocale(locale?: string | string[]) {
  if (Array.isArray(locale)) {
    return locale.find((value) => Boolean(value)) ?? i18n.language;
  }
  return locale ?? i18n.language;
}

function formatCompactFuture(
  key: "time.seconds" | "time.minutes",
  count: number,
  locale: string,
) {
  const translatedValue = i18n.t(key, { count, lng: locale });
  if (locale.startsWith("zh")) {
    return `${translatedValue}${i18n.t("time.in", { lng: locale })}`;
  }
  return `${i18n.t("time.in", { lng: locale })} ${translatedValue}`;
}

export function formatRelativeTime(timestamp: number, locale?: string | string[]) {
  const localeToUse = resolveLocale(locale);
  const now = Date.now();
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 5) {
    return i18n.t("time.now", { lng: localeToUse });
  }
  if (absSeconds < 60) {
    const value = Math.max(1, Math.round(absSeconds));
    return diffSeconds < 0
      ? i18n.t("time.secondsAgo", { count: value, lng: localeToUse })
      : formatCompactFuture("time.seconds", value, localeToUse);
  }
  if (absSeconds < 60 * 60) {
    const value = Math.max(1, Math.round(absSeconds / 60));
    return diffSeconds < 0
      ? i18n.t("time.minutesAgo", { count: value, lng: localeToUse })
      : formatCompactFuture("time.minutes", value, localeToUse);
  }
  const ranges: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "week", seconds: 60 * 60 * 24 * 7 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];
  const range =
    ranges.find((entry) => absSeconds >= entry.seconds) ||
    ranges[ranges.length - 1];
  if (!range) {
    return i18n.t("time.now", { lng: localeToUse });
  }
  const value = Math.round(diffSeconds / range.seconds);
  const formatter = new Intl.RelativeTimeFormat(localeToUse, { numeric: "auto" });
  return formatter.format(value, range.unit);
}

export function formatRelativeTimeShort(timestamp: number, locale?: string | string[]) {
  const localeToUse = resolveLocale(locale);
  const now = Date.now();
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) {
    return i18n.t("time.now", { lng: localeToUse });
  }
  const ranges: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "week", seconds: 60 * 60 * 24 * 7 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
  ];
  const range =
    ranges.find((entry) => absSeconds >= entry.seconds) ||
    ranges[ranges.length - 1];
  if (!range) {
    return i18n.t("time.now", { lng: localeToUse });
  }
  const value = Math.round(diffSeconds / range.seconds);
  try {
    const formatter = new Intl.RelativeTimeFormat(localeToUse, {
      numeric: "always",
      style: "narrow",
    });
    return formatter.format(value, range.unit);
  } catch {
    return formatRelativeTime(timestamp, localeToUse);
  }
}
