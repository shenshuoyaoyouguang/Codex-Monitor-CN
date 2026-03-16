import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { formatSpy, i18nMock, relativeTimeFormatSpy } = vi.hoisted(() => {
  const formatSpy = vi.fn();
  return {
    formatSpy,
    i18nMock: {
    language: "en",
    t: vi.fn((key: string, options?: Record<string, unknown>) => {
      const count = options?.count;
      const lng = options?.lng;
      switch (key) {
        case "time.now":
          return lng === "zh" ? "刚刚" : "now";
        case "time.in":
          return lng === "zh" ? "后" : "in";
        case "time.seconds":
          return lng === "zh" ? `${count}秒` : `${count}s`;
        case "time.minutes":
          return lng === "zh" ? `${count}分钟` : `${count}m`;
        case "time.secondsAgo":
          return lng === "zh" ? `${count}秒前` : `${count}s ago`;
        case "time.minutesAgo":
          return lng === "zh" ? `${count}分钟前` : `${count}m ago`;
        case "time.hoursAgo":
          return lng === "zh" ? `${count}小时前` : `${count}h ago`;
        case "time.daysAgo":
          return lng === "zh" ? `${count}天前` : `${count}d ago`;
        default:
          return key;
      }
    }),
  },
    relativeTimeFormatSpy: vi.fn(
      (locale: string, options: Intl.RelativeTimeFormatOptions) => ({
        format: (value: number, unit: Intl.RelativeTimeFormatUnit) => {
          formatSpy(value, unit, locale, options);
          return `rtf(${locale},${options.style ?? "long"},${options.numeric},${value},${unit})`;
        },
      }),
    ),
  };
});

vi.mock("@/i18n", () => ({
  default: i18nMock,
}));

import { formatRelativeTime, formatRelativeTimeShort } from "./time";

describe("time utils", () => {
  const originalRelativeTimeFormat = Intl.RelativeTimeFormat;
  let dateNowSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-03-16T12:00:00Z").getTime(),
    );
    i18nMock.language = "en";
    i18nMock.t.mockClear();
    formatSpy.mockClear();
    relativeTimeFormatSpy.mockClear();
    Object.defineProperty(Intl, "RelativeTimeFormat", {
      configurable: true,
      writable: true,
      value: relativeTimeFormatSpy,
    });
  });

  afterEach(() => {
    dateNowSpy?.mockRestore();
    Object.defineProperty(Intl, "RelativeTimeFormat", {
      configurable: true,
      writable: true,
      value: originalRelativeTimeFormat,
    });
  });

  it("formats sub-hour future values with the requested locale", () => {
    const timestamp = Date.now() + 45_000;

    expect(formatRelativeTime(timestamp, "zh")).toBe("45秒后");
    expect(i18nMock.t).toHaveBeenCalledWith("time.seconds", expect.objectContaining({ lng: "zh" }));
    expect(i18nMock.t).toHaveBeenCalledWith("time.in", { lng: "zh" });
  });

  it("falls back to the active i18n language for long-format Intl rendering", () => {
    i18nMock.language = "zh";
    const timestamp = Date.now() + 2 * 60 * 60 * 1000;

    expect(formatRelativeTime(timestamp)).toBe("rtf(zh,long,auto,2,hour)");
    expect(relativeTimeFormatSpy).toHaveBeenCalledWith("zh", { numeric: "auto" });
    expect(formatSpy).toHaveBeenCalledWith(2, "hour", "zh", { numeric: "auto" });
  });

  it("preserves future tense in the short formatter", () => {
    const timestamp = Date.now() + 3 * 60 * 60 * 1000;

    expect(formatRelativeTimeShort(timestamp, "en")).toBe("rtf(en,narrow,always,3,hour)");
    expect(relativeTimeFormatSpy).toHaveBeenCalledWith("en", {
      numeric: "always",
      style: "narrow",
    });
    expect(formatSpy).toHaveBeenCalledWith(3, "hour", "en", {
      numeric: "always",
      style: "narrow",
    });
  });

  it("keeps week-scale output in the short formatter", () => {
    const timestamp = Date.now() - 14 * 24 * 60 * 60 * 1000;

    expect(formatRelativeTimeShort(timestamp, "en")).toBe("rtf(en,narrow,always,-2,week)");
    expect(formatSpy).toHaveBeenCalledWith(-2, "week", "en", {
      numeric: "always",
      style: "narrow",
    });
  });
});
