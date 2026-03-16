import i18n from "@/i18n";

const SHORT_RANGES = [
  { thresholdSeconds: 60 * 60, seconds: 60, key: "time.minutesShort" },
  { thresholdSeconds: 60 * 60 * 24, seconds: 60 * 60, key: "time.hoursShort" },
  { thresholdSeconds: 60 * 60 * 24 * 7, seconds: 60 * 60 * 24, key: "time.daysShort" },
  { thresholdSeconds: 60 * 60 * 24 * 30, seconds: 60 * 60 * 24 * 7, key: "time.weeksShort" },
  { thresholdSeconds: 60 * 60 * 24 * 365, seconds: 60 * 60 * 24 * 30, key: "time.monthsShort" },
  { thresholdSeconds: Number.POSITIVE_INFINITY, seconds: 60 * 60 * 24 * 365, key: "time.yearsShort" },
] as const;

function resolveLocale(locale?: string | string[]) {
  if (Array.isArray(locale)) {
    return locale[0];
  }
  return locale;
}

export function formatRelativeTime(timestamp: number, locale?: string | string[]) {
  const now = Date.now();
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 5) {
    return i18n.t("time.now");
  }
  if (absSeconds < 60) {
    const value = Math.max(1, Math.round(absSeconds));
    return diffSeconds < 0
      ? i18n.t("time.secondsAgo", { count: value })
      : `${i18n.t("time.in")} ${i18n.t("time.seconds", { count: value })}`;
  }
  if (absSeconds < 60 * 60) {
    const value = Math.max(1, Math.round(absSeconds / 60));
    return diffSeconds < 0
      ? i18n.t("time.minutesAgo", { count: value })
      : `${i18n.t("time.in")} ${i18n.t("time.minutes", { count: value })}`;
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
    return i18n.t("time.now");
  }
  const value = Math.round(diffSeconds / range.seconds);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return formatter.format(value, range.unit);
}

export function formatRelativeTimeShort(timestamp: number, locale?: string | string[]) {
  const now = Date.now();
  const absSeconds = Math.abs(Math.round((timestamp - now) / 1000));
  if (absSeconds < 60) {
    return i18n.t("time.now");
  }
  const range = SHORT_RANGES.find((entry) => absSeconds < entry.thresholdSeconds);
  if (!range) {
    return i18n.t("time.now");
  }
  const resolvedLocale = resolveLocale(locale) ?? i18n.language;
  const value = Math.max(1, Math.round(absSeconds / range.seconds));
  return i18n.t(range.key, { count: value, lng: resolvedLocale });
}
