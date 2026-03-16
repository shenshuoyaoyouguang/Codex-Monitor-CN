import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockT } = vi.hoisted(() => ({
  mockT: vi.fn((key: string, options?: Record<string, unknown>) => {
    if (key === "time.now") {
      return "now";
    }
    if (key === "time.secondsAgo") {
      return `${options?.count}s ago`;
    }
    if (key === "time.secondsFromNow") {
      return `in ${options?.count}s`;
    }
    if (key === "time.minutesAgo") {
      return `${options?.count}m ago`;
    }
    if (key === "time.minutesFromNow") {
      return `in ${options?.count}m`;
    }
    return key;
  }),
}));

vi.mock("@/i18n", () => ({
  default: {
    language: "en",
    t: mockT,
  },
}));

import { formatRelativeTime, formatRelativeTimeShort } from "./time";

const OriginalRelativeTimeFormat = Intl.RelativeTimeFormat;

function setRelativeTimeFormat(value: typeof Intl.RelativeTimeFormat) {
  Object.defineProperty(Intl, "RelativeTimeFormat", {
    configurable: true,
    writable: true,
    value,
  });
}

describe("time utilities", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-01-01T00:00:00Z"));
    mockT.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setRelativeTimeFormat(OriginalRelativeTimeFormat);
  });

  it("uses localized future translations for sub-hour future values", () => {
    expect(formatRelativeTime(Date.now() + 5 * 60 * 1000)).toBe("in 5m");
    expect(mockT).toHaveBeenCalledWith("time.minutesFromNow", { count: 5 });
  });

  it("uses narrow Intl formatting for short relative times across units and directions", () => {
    const format = vi.fn((value: number, unit: Intl.RelativeTimeFormatUnit) => {
      return `fmt:${value}:${unit}`;
    });
    const relativeTimeFormat = vi.fn(() => ({ format }));
    setRelativeTimeFormat(relativeTimeFormat as unknown as typeof Intl.RelativeTimeFormat);

    expect(formatRelativeTimeShort(Date.now() + 30 * 60 * 1000)).toBe("fmt:30:minute");
    expect(formatRelativeTimeShort(Date.now() - 14 * 24 * 60 * 60 * 1000)).toBe(
      "fmt:-2:week",
    );
    expect(formatRelativeTimeShort(Date.now() + 30 * 24 * 60 * 60 * 1000)).toBe(
      "fmt:1:month",
    );
    expect(formatRelativeTimeShort(Date.now() + 365 * 24 * 60 * 60 * 1000)).toBe(
      "fmt:1:year",
    );
    expect(relativeTimeFormat).toHaveBeenCalledWith("en", {
      numeric: "always",
      style: "narrow",
    });
  });

  it("returns now for short timestamps under a minute", () => {
    expect(formatRelativeTimeShort(Date.now() + 20 * 1000)).toBe("now");
    expect(mockT).toHaveBeenCalledWith("time.now");
  });
});
