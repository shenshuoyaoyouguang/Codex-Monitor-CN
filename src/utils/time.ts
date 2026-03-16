import i18n from "@/i18n";

const RELATIVE_TIME_RANGES: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

function getRelativeTimeParts(timestamp: number) {
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const fallbackRange = RELATIVE_TIME_RANGES[RELATIVE_TIME_RANGES.length - 1];
  const range =
    RELATIVE_TIME_RANGES.find((entry) => absSeconds >= entry.seconds) ?? fallbackRange;

  return {
    diffSeconds,
    absSeconds,
    unit: range.unit,
    value: Math.round(diffSeconds / range.seconds),
  };
}

function formatWithRelativeTimeFormat(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string | string[] | undefined,
  options: Intl.RelativeTimeFormatOptions,
) {
  return new Intl.RelativeTimeFormat(locale ?? i18n.language, options).format(value, unit);
}

export function formatRelativeTime(timestamp: number, locale?: string | string[]) {
  const { diffSeconds, absSeconds, unit, value } = getRelativeTimeParts(timestamp);

  if (absSeconds < 5) {
    return i18n.t("time.now");
  }
  if (absSeconds < 60) {
    const seconds = Math.max(1, Math.round(absSeconds));
    return diffSeconds < 0
      ? i18n.t("time.secondsAgo", { count: seconds })
      : i18n.t("time.secondsFromNow", { count: seconds });
  }
  if (absSeconds < 60 * 60) {
    const minutes = Math.max(1, Math.round(absSeconds / 60));
    return diffSeconds < 0
      ? i18n.t("time.minutesAgo", { count: minutes })
      : i18n.t("time.minutesFromNow", { count: minutes });
  }

  return formatWithRelativeTimeFormat(value, unit, locale, { numeric: "auto" });
}

export function formatRelativeTimeShort(timestamp: number, locale?: string | string[]) {
  const { absSeconds, unit, value } = getRelativeTimeParts(timestamp);

  if (absSeconds < 60) {
    return i18n.t("time.now");
  }

  return formatWithRelativeTimeFormat(value, unit, locale, {
    numeric: "always",
    style: "narrow",
  });
}
