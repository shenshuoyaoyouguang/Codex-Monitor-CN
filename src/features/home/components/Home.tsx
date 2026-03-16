import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  AccountSnapshot,
  LocalUsageDay,
  LocalUsageSnapshot,
  RateLimitSnapshot,
} from "../../../types";
import { formatRelativeTime } from "../../../utils/time";
import { getUsageLabels } from "../../app/utils/usageLabels";

type LatestAgentRun = {
  message: string;
  timestamp: number;
  projectName: string;
  groupName?: string | null;
  workspaceId: string;
  threadId: string;
  isProcessing: boolean;
};

type UsageMetric = "tokens" | "time";

type UsageWorkspaceOption = {
  id: string;
  label: string;
};

type HomeStatCard = {
  label: string;
  value: string;
  suffix?: string | null;
  caption: string;
  compact?: boolean;
};

type HomeProps = {
  onAddWorkspace: () => void;
  onAddWorkspaceFromUrl: () => void;
  latestAgentRuns: LatestAgentRun[];
  isLoadingLatestAgents: boolean;
  localUsageSnapshot: LocalUsageSnapshot | null;
  isLoadingLocalUsage: boolean;
  localUsageError: string | null;
  onRefreshLocalUsage: () => void;
  usageMetric: UsageMetric;
  onUsageMetricChange: (metric: UsageMetric) => void;
  usageWorkspaceId: string | null;
  usageWorkspaceOptions: UsageWorkspaceOption[];
  onUsageWorkspaceChange: (workspaceId: string | null) => void;
  accountRateLimits: RateLimitSnapshot | null;
  usageShowRemaining: boolean;
  accountInfo: AccountSnapshot | null;
  onSelectThread: (workspaceId: string, threadId: string) => void;
};

function formatCompactNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }
  if (value >= 1_000_000_000) {
    const scaled = value / 1_000_000_000;
    return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}b`;
  }
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}m`;
  }
  if (value >= 1_000) {
    const scaled = value / 1_000;
    return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}k`;
  }
  return String(value);
}

function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }
  return new Intl.NumberFormat().format(value);
}

function formatDuration(valueMs: number | null | undefined) {
  if (valueMs === null || valueMs === undefined) {
    return "--";
  }
  const totalSeconds = Math.max(0, Math.round(valueMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }
  return `${totalSeconds}s`;
}

function formatDurationCompact(valueMs: number | null | undefined) {
  if (valueMs === null || valueMs === undefined) {
    return "--";
  }
  const totalMinutes = Math.max(0, Math.round(valueMs / 60000));
  if (totalMinutes >= 60) {
    const hours = totalMinutes / 60;
    return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }
  const seconds = Math.max(0, Math.round(valueMs / 1000));
  return `${seconds}s`;
}

function formatDayLabel(value: string | null | undefined, locale?: string) {
  if (!value) {
    return "--";
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale ?? "en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatWeekRange(
  days: LocalUsageDay[],
  t: (key: string, options?: Record<string, unknown>) => string,
  locale?: string,
) {
  if (days.length === 0) {
    return t("home.noUsageData");
  }
  const first = days[0];
  const last = days[days.length - 1];
  const firstLabel = formatDayLabel(first?.day, locale);
  const lastLabel = formatDayLabel(last?.day, locale);
  return first?.day === last?.day
    ? firstLabel
    : `${firstLabel} ${t("home.to")} ${lastLabel}`;
}

function isUsageDayActive(day: LocalUsageDay) {
  return day.totalTokens > 0 || day.agentTimeMs > 0 || day.agentRuns > 0;
}

function formatPlanType(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatWindowDuration(valueMins: number | null | undefined) {
  if (typeof valueMins !== "number" || !Number.isFinite(valueMins) || valueMins <= 0) {
    return null;
  }
  if (valueMins >= 60 * 24) {
    const days = Math.round(valueMins / (60 * 24));
    return `${days} day${days === 1 ? "" : "s"} window`;
  }
  if (valueMins >= 60) {
    const hours = Math.round(valueMins / 60);
    return `${hours}h window`;
  }
  return `${Math.round(valueMins)}m window`;
}

function buildWindowCaption(
  resetLabel: string | null,
  windowDurationMins: number | null | undefined,
  fallback: string,
) {
  const parts = [resetLabel, formatWindowDuration(windowDurationMins)].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fallback;
}

function formatCreditsBalance(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return trimmed;
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function Home({
  onAddWorkspace,
  onAddWorkspaceFromUrl,
  latestAgentRuns,
  isLoadingLatestAgents,
  localUsageSnapshot,
  isLoadingLocalUsage,
  localUsageError,
  onRefreshLocalUsage,
  usageMetric,
  onUsageMetricChange,
  usageWorkspaceId,
  usageWorkspaceOptions,
  onUsageWorkspaceChange,
  accountRateLimits,
  usageShowRemaining,
  accountInfo,
  onSelectThread,
}: HomeProps) {
  const { t, i18n } = useTranslation();
  const [chartWeekOffset, setChartWeekOffset] = useState(0);

  const usageTotals = localUsageSnapshot?.totals ?? null;
  const usageDays = localUsageSnapshot?.days ?? [];
  const latestUsageDay = usageDays[usageDays.length - 1] ?? null;
  const last7Days = usageDays.slice(-7);
  const last7Tokens = last7Days.reduce((total, day) => total + day.totalTokens, 0);
  const last7Input = last7Days.reduce((total, day) => total + day.inputTokens, 0);
  const last7Cached = last7Days.reduce(
    (total, day) => total + day.cachedInputTokens,
    0,
  );
  const last7AgentMs = last7Days.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const last30AgentMs = usageDays.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const averageDailyAgentMs =
    last7Days.length > 0 ? Math.round(last7AgentMs / last7Days.length) : 0;
  const last7AgentRuns = last7Days.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const last30AgentRuns = usageDays.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const averageTokensPerRun =
    last7AgentRuns > 0 ? Math.round(last7Tokens / last7AgentRuns) : null;
  const averageRunDurationMs =
    last7AgentRuns > 0 ? Math.round(last7AgentMs / last7AgentRuns) : null;
  const last7ActiveDays = last7Days.filter(isUsageDayActive).length;
  const last30ActiveDays = usageDays.filter(isUsageDayActive).length;
  const averageActiveDayAgentMs =
    last7ActiveDays > 0 ? Math.round(last7AgentMs / last7ActiveDays) : null;
  const peakAgentDay = usageDays.reduce<
    | { day: string; agentTimeMs: number }
    | null
  >((best, day) => {
    const value = day.agentTimeMs ?? 0;
    if (value <= 0) {
      return best;
    }
    if (!best || value > best.agentTimeMs) {
      return { day: day.day, agentTimeMs: value };
    }
    return best;
  }, null);
  const peakAgentDayLabel = peakAgentDay?.day ?? null;
  const peakAgentTimeMs = peakAgentDay?.agentTimeMs ?? 0;
  const maxHistoricalWeekOffset = Math.max(0, Math.ceil(usageDays.length / 7) - 1);
  useEffect(() => {
    setChartWeekOffset((previous) => Math.min(previous, maxHistoricalWeekOffset));
  }, [maxHistoricalWeekOffset]);
  const chartWeekEnd = Math.max(0, usageDays.length - chartWeekOffset * 7);
  const chartWeekStart = Math.max(0, chartWeekEnd - 7);
  const chartDays = usageDays.slice(chartWeekStart, chartWeekEnd);
  const maxUsageValue = Math.max(
    1,
    ...chartDays.map((day) =>
      usageMetric === "tokens" ? day.totalTokens : day.agentTimeMs ?? 0,
    ),
  );
  const canShowOlderWeek = chartWeekOffset < maxHistoricalWeekOffset;
  const canShowNewerWeek = chartWeekOffset > 0;
  const chartRangeLabel = formatWeekRange(chartDays, t, i18n.language);
  const chartRangeAriaLabel =
    chartDays.length > 0
      ? `${t("home.usageWeek")} ${chartDays[0]?.day} ${t("home.to")} ${chartDays[chartDays.length - 1]?.day}`
      : t("home.usageWeek");
  let longestStreak = 0;
  let runningStreak = 0;
  for (const day of usageDays) {
    if (isUsageDayActive(day)) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const longestStreakCard: HomeStatCard = {
    label: t("home.longestStreak"),
    value: longestStreak > 0 ? formatDayCount(longestStreak, t) : "--",
    caption:
      longestStreak > 0
        ? t("home.acrossUsageRange")
        : t("home.noActiveStreak"),
    compact: true,
  };
  const activeDaysCard: HomeStatCard = {
    label: t("home.activeDays"),
    value: last7Days.length > 0 ? `${last7ActiveDays} / ${last7Days.length}` : "--",
    caption:
      usageDays.length > 0
        ? `${last30ActiveDays} / ${usageDays.length} ${t("home.inCurrentRange")}`
        : t("home.noActivityYet"),
    compact: true,
  };
  const usageCards: HomeStatCard[] =
    usageMetric === "tokens"
      ? [
          {
            label: t("home.today"),
            value: formatCompactNumber(latestUsageDay?.totalTokens ?? 0),
            suffix: t("home.tokensUnit"),
            caption: latestUsageDay
              ? `${formatDayLabel(latestUsageDay.day, i18n.language)} · ${formatCount(
                  latestUsageDay.inputTokens,
                )} in / ${formatCount(latestUsageDay.outputTokens)} out`
              : t("home.latestDay"),
          },
          {
            label: t("home.last7Days"),
            value: formatCompactNumber(usageTotals?.last7DaysTokens ?? last7Tokens),
            suffix: t("home.tokensUnit"),
            caption: `${t("home.avgPerDay")} ${formatCompactNumber(usageTotals?.averageDailyTokens)}`,
          },
          {
            label: t("home.last30Days"),
            value: formatCompactNumber(usageTotals?.last30DaysTokens ?? last7Tokens),
            suffix: t("home.tokensUnit"),
            caption: `${t("home.last30Days")} ${formatCount(usageTotals?.last30DaysTokens ?? last7Tokens)}`,
          },
          {
            label: t("home.cacheHitRate"),
            value: usageTotals
              ? `${usageTotals.cacheHitRatePercent.toFixed(1)}%`
              : "--",
            caption: t("home.last7DaysCaption"),
          },
          {
            label: t("home.cachedTokens"),
            value: formatCompactNumber(last7Cached),
            suffix: t("home.saved"),
            caption:
              last7Input > 0
                ? `${((last7Cached / last7Input) * 100).toFixed(1)}% ${t("home.ofPromptTokens")}`
                : t("home.last7DaysCaption"),
          },
          {
            label: t("home.avgPerRun"),
            value:
              averageTokensPerRun === null
                ? "--"
                : formatCompactNumber(averageTokensPerRun),
            suffix: t("home.tokensUnit"),
            caption:
              last7AgentRuns > 0
                ? `${formatCount(last7AgentRuns)} ${t("home.runsInLast7Days")}`
                : t("home.noRunsYet"),
          },
          {
            label: t("home.peakDay"),
            value: formatDayLabel(usageTotals?.peakDay, i18n.language),
            caption: `${formatCompactNumber(usageTotals?.peakDayTokens)} ${t("home.tokensUnit")}`,
          },
        ]
      : [
          {
            label: t("home.last7Days"),
            value: formatDurationCompact(last7AgentMs),
            suffix: t("home.agentTime"),
            caption: `${t("home.avgPerDay")} ${formatDurationCompact(averageDailyAgentMs)}`,
          },
          {
            label: t("home.last30Days"),
            value: formatDurationCompact(last30AgentMs),
            suffix: t("home.agentTime"),
            caption: `${t("home.last30Days")} ${formatDuration(last30AgentMs)}`,
          },
          {
            label: t("home.runs"),
            value: formatCount(last7AgentRuns),
            suffix: t("home.runsUnit"),
            caption: `${t("home.last30Days")}: ${formatCount(last30AgentRuns)} ${t("home.runsUnit")}`,
          },
          {
            label: t("home.avgPerRun"),
            value: formatDurationCompact(averageRunDurationMs),
            caption:
              last7AgentRuns > 0
                ? `Across ${formatCount(last7AgentRuns)} ${t("home.runsUnit")}`
                : t("home.noRunsYet"),
          },
          {
            label: t("home.avgPerActiveDay"),
            value: formatDurationCompact(averageActiveDayAgentMs),
            caption:
              last7ActiveDays > 0
                ? `${formatCount(last7ActiveDays)} ${t("home.activeDaysInLast7")}`
                : t("home.noActiveDaysYet"),
          },
          {
            label: t("home.peakDay"),
            value: formatDayLabel(peakAgentDayLabel, i18n.language),
            caption: `${formatDurationCompact(peakAgentTimeMs)} ${t("home.agentTime")}`,
          },
        ];
  const usageInsights = [longestStreakCard, activeDaysCard];
  const usagePercentLabels = getUsageLabels(accountRateLimits, usageShowRemaining);
  const planLabel = formatPlanType(accountRateLimits?.planType ?? accountInfo?.planType);
  const creditsBalance = formatCreditsBalance(accountRateLimits?.credits?.balance);
  const accountCards: HomeStatCard[] = [];

  if (usagePercentLabels.sessionPercent !== null) {
    accountCards.push({
      label: t(usageShowRemaining ? "home.sessionLeft" : "home.sessionUsage"),
      value: `${usagePercentLabels.sessionPercent}%`,
      caption: buildWindowCaption(
        usagePercentLabels.sessionResetLabel,
        accountRateLimits?.primary?.windowDurationMins,
        t("home.currentWindow"),
      ),
    });
  }

  if (usagePercentLabels.showWeekly && usagePercentLabels.weeklyPercent !== null) {
    accountCards.push({
      label: t(usageShowRemaining ? "home.weeklyLeft" : "home.weeklyUsage"),
      value: `${usagePercentLabels.weeklyPercent}%`,
      caption: buildWindowCaption(
        usagePercentLabels.weeklyResetLabel,
        accountRateLimits?.secondary?.windowDurationMins,
        t("home.longerWindow"),
      ),
    });
  }

  if (accountRateLimits?.credits?.hasCredits) {
    accountCards.push(
      accountRateLimits.credits.unlimited
        ? {
            label: t("home.credits"),
            value: t("home.unlimited"),
            caption: t("home.availableBalance"),
          }
        : {
            label: t("home.credits"),
            value: creditsBalance ?? "--",
            suffix: creditsBalance ? t("home.creditsUnit") : null,
            caption: t("home.availableBalance"),
          },
    );
  }

  if (planLabel) {
    accountCards.push({
      label: t("home.plan"),
      value: planLabel,
      caption: t(
        accountInfo?.type === "chatgpt"
          ? "home.chatGptAccount"
          : accountInfo?.type === "apikey"
            ? "home.apiKey"
            : "home.connectedAccount"
      ),
    });
  }

  const accountMeta = accountInfo?.email ?? null;
  const updatedLabel = localUsageSnapshot
    ? `${t("home.updated")} ${formatRelativeTime(localUsageSnapshot.updatedAt, i18n.language)}`
    : null;
  const showUsageSkeleton = isLoadingLocalUsage && !localUsageSnapshot;
  const showUsageEmpty = !isLoadingLocalUsage && !localUsageSnapshot;

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-title">{t("home.title")}</div>
        <div className="home-subtitle">
          {t("home.subtitle")}
        </div>
      </div>
      <div className="home-latest">
        <div className="home-latest-header">
          <div className="home-latest-label">{t("home.latestAgents")}</div>
        </div>
        {latestAgentRuns.length > 0 ? (
          <div className="home-latest-grid">
            {latestAgentRuns.map((run) => (
              <button
                className="home-latest-card home-latest-card-button"
                key={run.threadId}
                onClick={() => onSelectThread(run.workspaceId, run.threadId)}
                type="button"
              >
                <div className="home-latest-card-header">
                  <div className="home-latest-project">
                    <span className="home-latest-project-name">{run.projectName}</span>
                    {run.groupName && (
                      <span className="home-latest-group">{run.groupName}</span>
                    )}
                  </div>
                  <div className="home-latest-time">
                    {formatRelativeTime(run.timestamp, i18n.language)}
                  </div>
                </div>
                <div className="home-latest-message">
                  {run.message.trim() || t("home.agentReplied")}
                </div>
                {run.isProcessing && (
                  <div className="home-latest-status">{t("home.running")}</div>
                )}
              </button>
            ))}
          </div>
        ) : isLoadingLatestAgents ? (
          <div className="home-latest-grid home-latest-grid-loading" aria-label={t("home.loadingAgents")}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="home-latest-card home-latest-card-skeleton" key={index}>
                <div className="home-latest-card-header">
                  <span className="home-latest-skeleton home-latest-skeleton-title" />
                  <span className="home-latest-skeleton home-latest-skeleton-time" />
                </div>
                <span className="home-latest-skeleton home-latest-skeleton-line" />
                <span className="home-latest-skeleton home-latest-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="home-latest-empty">
            <div className="home-latest-empty-title">{t("home.noAgentActivity")}</div>
            <div className="home-latest-empty-subtitle">
              {t("home.startThreadHint")}
            </div>
          </div>
        )}
      </div>
      <div className="home-actions">
        <button
          className="home-button primary home-add-workspaces-button"
          onClick={onAddWorkspace}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            +
          </span>
          {t("home.addWorkspaces")}
        </button>
        <button
          className="home-button secondary home-add-workspace-from-url-button"
          onClick={onAddWorkspaceFromUrl}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            ⤓
          </span>
          {t("home.addWorkspaceFromUrl")}
        </button>
      </div>
      <div className="home-usage">
        <div className="home-section-header">
          <div className="home-section-title">{t("home.usageSnapshot")}</div>
          <div className="home-section-meta-row">
            {updatedLabel && <div className="home-section-meta">{updatedLabel}</div>}
            <button
              type="button"
              className={
                isLoadingLocalUsage
                  ? "home-usage-refresh is-loading"
                  : "home-usage-refresh"
              }
              onClick={onRefreshLocalUsage}
              disabled={isLoadingLocalUsage}
              aria-label={t("home.refreshUsage")}
              title={t("home.refreshUsage")}
            >
              <RefreshCw
                className={
                  isLoadingLocalUsage
                    ? "home-usage-refresh-icon spinning"
                    : "home-usage-refresh-icon"
                }
                aria-hidden
              />
            </button>
          </div>
        </div>
        <div className="home-usage-controls">
          <div className="home-usage-control-group">
            <span className="home-usage-control-label">{t("home.workspace")}</span>
            <div className="home-usage-select-wrap">
              <select
                className="home-usage-select"
                value={usageWorkspaceId ?? ""}
                onChange={(event) =>
                  onUsageWorkspaceChange(event.target.value || null)
                }
                disabled={usageWorkspaceOptions.length === 0}
              >
                <option value="">{t("home.allWorkspaces")}</option>
                {usageWorkspaceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="home-usage-control-group">
            <span className="home-usage-control-label">{t("home.view")}</span>
            <div className="home-usage-toggle" role="group" aria-label={t("home.usageSnapshot")}>
              <button
                type="button"
                className={
                  usageMetric === "tokens"
                    ? "home-usage-toggle-button is-active"
                    : "home-usage-toggle-button"
                }
                onClick={() => onUsageMetricChange("tokens")}
                aria-pressed={usageMetric === "tokens"}
              >
                {t("home.tokens")}
              </button>
              <button
                type="button"
                className={
                  usageMetric === "time"
                    ? "home-usage-toggle-button is-active"
                    : "home-usage-toggle-button"
                }
                onClick={() => onUsageMetricChange("time")}
                aria-pressed={usageMetric === "time"}
              >
                {t("home.time")}
              </button>
            </div>
          </div>
        </div>
        {showUsageSkeleton ? (
          <div className="home-usage-skeleton">
            <div className="home-usage-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="home-usage-card" key={index}>
                  <span className="home-latest-skeleton home-usage-skeleton-label" />
                  <span className="home-latest-skeleton home-usage-skeleton-value" />
                </div>
              ))}
            </div>
            <div className="home-usage-chart-card">
              <span className="home-latest-skeleton home-usage-skeleton-chart" />
            </div>
          </div>
        ) : showUsageEmpty ? (
          <div className="home-usage-empty">
            <div className="home-usage-empty-title">{t("home.noUsageData")}</div>
            <div className="home-usage-empty-subtitle">
              {t("home.runCodexHint")}
            </div>
            {localUsageError && (
              <div className="home-usage-error">{localUsageError}</div>
            )}
          </div>
        ) : (
          <>
            <div className="home-usage-grid">
              {usageCards.map((card) => (
                <div className="home-usage-card" key={card.label}>
                  <div className="home-usage-label">{card.label}</div>
                  <div className="home-usage-value">
                    <span className="home-usage-number">{card.value}</span>
                    {card.suffix && <span className="home-usage-suffix">{card.suffix}</span>}
                  </div>
                  <div className="home-usage-caption">{card.caption}</div>
                </div>
              ))}
            </div>
            <div className="home-usage-chart-card">
              <div className="home-usage-chart-nav">
                <div
                  className="home-usage-chart-range"
                  aria-label={chartRangeAriaLabel}
                  aria-live="polite"
                >
                  {chartRangeLabel}
                </div>
                <div className="home-usage-chart-actions">
                  {canShowOlderWeek && (
                    <button
                      type="button"
                      className="home-usage-chart-button"
                      onClick={() => setChartWeekOffset((current) => current + 1)}
                      aria-label={t("home.showPreviousWeek")}
                      title={t("home.showPreviousWeek")}
                    >
                      <ChevronLeft aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    className="home-usage-chart-button"
                    onClick={() => setChartWeekOffset((current) => Math.max(0, current - 1))}
                    aria-label={t("home.showNextWeek")}
                    title={t("home.showNextWeek")}
                    disabled={!canShowNewerWeek}
                  >
                    <ChevronRight aria-hidden />
                  </button>
                </div>
              </div>
              <div className="home-usage-chart">
                {chartDays.map((day) => {
                  const value =
                    usageMetric === "tokens" ? day.totalTokens : day.agentTimeMs ?? 0;
                  const height = Math.max(
                    6,
                    Math.round((value / maxUsageValue) * 100),
                  );
                  const tooltip =
                    usageMetric === "tokens"
                      ? `${formatDayLabel(day.day, i18n.language)} · ${formatCount(day.totalTokens)} ${t("home.tokensUnit")}`
                      : `${formatDayLabel(day.day, i18n.language)} · ${formatDuration(day.agentTimeMs ?? 0)} ${t("home.agentTime")}`;
                  return (
                    <div
                      className="home-usage-bar"
                      key={day.day}
                      data-value={tooltip}
                    >
                      <span
                        className="home-usage-bar-fill"
                        style={{ height: `${height}%` }}
                      />
                      <span className="home-usage-bar-label">
                        {formatDayLabel(day.day, i18n.language)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="home-usage-insights">
              {usageInsights.map((card) => (
                <div
                  className="home-usage-card is-compact"
                  key={card.label}
                >
                  <div className="home-usage-label">{card.label}</div>
                  <div className="home-usage-value">
                    <span className="home-usage-number">{card.value}</span>
                    {card.suffix && <span className="home-usage-suffix">{card.suffix}</span>}
                  </div>
                  <div className="home-usage-caption">{card.caption}</div>
                </div>
              ))}
            </div>
            <div className="home-usage-models">
              <div className="home-usage-models-label">
                {t("home.topModels")}
                {usageMetric === "time" && (
                  <span className="home-usage-models-hint">{t("home.tokens")}</span>
                )}
              </div>
              <div className="home-usage-models-list">
                {localUsageSnapshot?.topModels?.length ? (
                  localUsageSnapshot.topModels.map((model) => (
                    <span
                      className="home-usage-model-chip"
                      key={model.model}
                      title={`${model.model}: ${formatCount(model.tokens)} ${t("home.tokensUnit")}`}
                    >
                      {model.model}
                      <span className="home-usage-model-share">
                        {model.sharePercent.toFixed(1)}%
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="home-usage-model-empty">{t("home.noModelsYet")}</span>
                )}
              </div>
              {localUsageError && (
                <div className="home-usage-error">{localUsageError}</div>
              )}
            </div>
          </>
        )}
        {accountCards.length > 0 && (
          <div className="home-account">
            <div className="home-section-header">
              <div className="home-section-title">{t("home.accountLimits")}</div>
              {accountMeta && (
                <div className="home-section-meta-row">
                  <div className="home-section-meta">{accountMeta}</div>
                </div>
              )}
            </div>
            <div className="home-usage-grid home-account-grid">
              {accountCards.map((card) => (
                <div className="home-usage-card" key={card.label}>
                  <div className="home-usage-label">{card.label}</div>
                  <div className="home-usage-value">
                    <span className="home-usage-number">{card.value}</span>
                    {card.suffix && (
                      <span className="home-usage-suffix">{card.suffix}</span>
                    )}
                  </div>
                  <div className="home-usage-caption">{card.caption}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function formatDayCount(
  value: number | null | undefined,
  t?: (key: string, options?: Record<string, unknown>) => string,
) {
  if (value === null || value === undefined) {
    return "--";
  }
  if (t) {
    return t("time.days", { count: value });
  }
  return String(value);
}
