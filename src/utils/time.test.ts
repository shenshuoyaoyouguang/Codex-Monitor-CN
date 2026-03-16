import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTimeShort } from "./time";

vi.mock("@/i18n", async () => {
  const { createI18nModuleMock } = await import("@/test/i18nMock");
  return createI18nModuleMock({
    "time.now": "now",
    "time.minutesShort": "{{count}}m",
    "time.hoursShort": "{{count}}h",
    "time.daysShort": "{{count}}d",
    "time.weeksShort": "{{count}}w",
    "time.monthsShort": "{{count}}mo",
    "time.yearsShort": "{{count}}y",
  });
});

describe("formatRelativeTimeShort", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-03-16T00:00:00Z").valueOf());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns compact week, month, and year labels for older timestamps", () => {
    expect(
      formatRelativeTimeShort(Date.now() - 10 * 24 * 60 * 60 * 1000),
    ).toBe("1w");
    expect(
      formatRelativeTimeShort(Date.now() - 40 * 24 * 60 * 60 * 1000),
    ).toBe("1mo");
    expect(
      formatRelativeTimeShort(Date.now() - 400 * 24 * 60 * 60 * 1000),
    ).toBe("1y");
  });
});
