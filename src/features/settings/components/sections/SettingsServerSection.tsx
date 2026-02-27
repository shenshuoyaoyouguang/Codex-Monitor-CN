import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type {
  AppSettings,
  TailscaleDaemonCommandPreview,
  TailscaleStatus,
  TcpDaemonStatus,
} from "@/types";

export type SettingsServerSectionProps = {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  isMobilePlatform: boolean;
  mobileConnectBusy: boolean;
  mobileConnectStatusText: string | null;
  mobileConnectStatusError: boolean;
  remoteBackends: AppSettings["remoteBackends"];
  activeRemoteBackendId: string | null;
  remoteStatusText: string | null;
  remoteStatusError: boolean;
  remoteNameError: string | null;
  remoteHostError: string | null;
  remoteNameDraft: string;
  remoteHostDraft: string;
  remoteTokenDraft: string;
  nextRemoteNameSuggestion: string;
  tailscaleStatus: TailscaleStatus | null;
  tailscaleStatusBusy: boolean;
  tailscaleStatusError: string | null;
  tailscaleCommandPreview: TailscaleDaemonCommandPreview | null;
  tailscaleCommandBusy: boolean;
  tailscaleCommandError: string | null;
  tcpDaemonStatus: TcpDaemonStatus | null;
  tcpDaemonBusyAction: "start" | "stop" | "status" | null;
  onSetRemoteNameDraft: Dispatch<SetStateAction<string>>;
  onSetRemoteHostDraft: Dispatch<SetStateAction<string>>;
  onSetRemoteTokenDraft: Dispatch<SetStateAction<string>>;
  onCommitRemoteName: () => Promise<void>;
  onCommitRemoteHost: () => Promise<void>;
  onCommitRemoteToken: () => Promise<void>;
  onSelectRemoteBackend: (id: string) => Promise<void>;
  onAddRemoteBackend: (draft: { name: string; host: string; token: string }) => Promise<void>;
  onMoveRemoteBackend: (id: string, direction: "up" | "down") => Promise<void>;
  onDeleteRemoteBackend: (id: string) => Promise<void>;
  onRefreshTailscaleStatus: () => void;
  onRefreshTailscaleCommandPreview: () => void;
  onUseSuggestedTailscaleHost: () => Promise<void>;
  onTcpDaemonStart: () => Promise<void>;
  onTcpDaemonStop: () => Promise<void>;
  onTcpDaemonStatus: () => Promise<void>;
  onMobileConnectTest: () => void;
};

export function SettingsServerSection({
  appSettings,
  onUpdateAppSettings,
  isMobilePlatform,
  mobileConnectBusy,
  mobileConnectStatusText,
  mobileConnectStatusError,
  remoteHostDraft,
  remoteTokenDraft,
  tailscaleStatus,
  tailscaleStatusBusy,
  tailscaleStatusError,
  tailscaleCommandPreview,
  tailscaleCommandBusy,
  tailscaleCommandError,
  tcpDaemonStatus,
  tcpDaemonBusyAction,
  onSetRemoteHostDraft,
  onSetRemoteTokenDraft,
  onCommitRemoteHost,
  onCommitRemoteToken,
  onRefreshTailscaleStatus,
  onRefreshTailscaleCommandPreview,
  onUseSuggestedTailscaleHost,
  onTcpDaemonStart,
  onTcpDaemonStop,
  onTcpDaemonStatus,
  onMobileConnectTest,
}: SettingsServerSectionProps) {
  const isMobileSimplified = isMobilePlatform;
  const { t } = useTranslation();
  const tcpRunnerStatusText = (() => {
    if (!tcpDaemonStatus) {
      return null;
    }
    if (tcpDaemonStatus.state === "running") {
      return tcpDaemonStatus.pid
        ? t('server.daemon_running_pid', { pid: tcpDaemonStatus.pid, addr: tcpDaemonStatus.listenAddr ?? t('server.daemon_running').replace('监听 ', '') })
        : t('server.daemon_running', { addr: tcpDaemonStatus.listenAddr ?? "configured listen address" });
    }
    if (tcpDaemonStatus.state === "error") {
      return tcpDaemonStatus.lastError ?? t('server.daemon_error');
    }
    return t('server.daemon_stopped', { addr: tcpDaemonStatus.listenAddr ? ` (${tcpDaemonStatus.listenAddr})` : "" });
  })();

  return (
    <section className="settings-section">
      <div className="settings-section-title">{t('server.title')}</div>
      <div className="settings-section-subtitle">
        {isMobileSimplified
          ? t('server.subtitle_mobile')
          : t('server.subtitle_desktop')}
      </div>

      {!isMobileSimplified && (
        <div className="settings-field">
          <label className="settings-field-label" htmlFor="backend-mode">
            {t('settings.features.backend_mode')}
          </label>
          <select
            id="backend-mode"
            className="settings-select"
            value={appSettings.backendMode}
            onChange={(event) =>
              void onUpdateAppSettings({
                ...appSettings,
                backendMode: event.target.value as AppSettings["backendMode"],
              })
            }
          >
            <option value="local">{t('settings.features.local')}</option>
            <option value="remote">{t('settings.features.remote')}</option>
          </select>
          <div className="settings-help">
            {t('settings.features.remote_description')}
          </div>
        </div>
      )}

      {!isMobileSimplified && (
        <div className="settings-toggle-row">
          <div>
            <div className="settings-toggle-title">{t('server.keep_daemon_running')}</div>
            <div className="settings-toggle-subtitle">
              {t('server.keep_daemon_running_subtitle')}
            </div>
          </div>
          <button
            type="button"
            className={`settings-toggle ${appSettings.keepDaemonRunningAfterAppClose ? "on" : ""}`}
            onClick={() =>
              void onUpdateAppSettings({
                ...appSettings,
                keepDaemonRunningAfterAppClose: !appSettings.keepDaemonRunningAfterAppClose,
              })
            }
            aria-pressed={appSettings.keepDaemonRunningAfterAppClose}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
      )}

      <div className="settings-field">
        <div className="settings-field-label">{t('settings.features.remote_backend')}</div>
        <div className="settings-field-row">
          <input
            className="settings-input settings-input--compact"
            value={remoteHostDraft}
            placeholder="127.0.0.1:4732"
            onChange={(event) => onSetRemoteHostDraft(event.target.value)}
            onBlur={() => {
              void onCommitRemoteHost();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitRemoteHost();
              }
            }}
            aria-label={t('settings.features.host')}
          />
          <input
            type="password"
            className="settings-input settings-input--compact"
            value={remoteTokenDraft}
            placeholder="Token (required)"
            onChange={(event) => onSetRemoteTokenDraft(event.target.value)}
            onBlur={() => {
              void onCommitRemoteToken();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitRemoteToken();
              }
            }}
            aria-label={t('settings.features.remote_backend')}
          />
        </div>
        <div className="settings-help">
          {isMobileSimplified
            ? t('server.use_tcp_help_mobile')
            : t('server.host_token_help_desktop')}
        </div>
      </div>

      {isMobileSimplified && (
        <div className="settings-field">
          <div className="settings-field-label">{t('server.connection_test')}</div>
          <div className="settings-field-row">
            <button
              type="button"
              className="button settings-button-compact"
              onClick={onMobileConnectTest}
              disabled={mobileConnectBusy}
            >
              {mobileConnectBusy ? t('server.connecting') : t('server.connect_and_test')}
            </button>
          </div>
          {mobileConnectStatusText && (
            <div
              className={`settings-help${mobileConnectStatusError ? " settings-help-error" : ""}`}
            >
              {mobileConnectStatusText}
            </div>
          )}
          <div className="settings-help">
            {t('server.connection_test_help_tcp')}
          </div>
        </div>
      )}

      {!isMobileSimplified && (
        <div className="settings-field">
          <div className="settings-field-label">{t('server.mobile_access_daemon')}</div>
          <div className="settings-field-row">
            <button
              type="button"
              className="button settings-button-compact"
              onClick={() => {
                void onTcpDaemonStart();
              }}
              disabled={tcpDaemonBusyAction !== null}
            >
              {tcpDaemonBusyAction === "start" ? t('server.starting') : t('server.start_daemon')}
            </button>
            <button
              type="button"
              className="button settings-button-compact"
              onClick={() => {
                void onTcpDaemonStop();
              }}
              disabled={tcpDaemonBusyAction !== null}
            >
              {tcpDaemonBusyAction === "stop" ? t('server.stopping') : t('server.stop_daemon')}
            </button>
            <button
              type="button"
              className="button settings-button-compact"
              onClick={() => {
                void onTcpDaemonStatus();
              }}
              disabled={tcpDaemonBusyAction !== null}
            >
              {tcpDaemonBusyAction === "status" ? t('server.refreshing') : t('server.refresh_status')}
            </button>
          </div>
          {tcpRunnerStatusText && <div className="settings-help">{tcpRunnerStatusText}</div>}
          {tcpDaemonStatus?.startedAtMs && (
            <div className="settings-help">
              {t('server.started_at', { time: new Date(tcpDaemonStatus.startedAtMs).toLocaleString() })}
            </div>
          )}
          <div className="settings-help" dangerouslySetInnerHTML={{ __html: t('server.daemon_help') }} />
        </div>
      )}

      {!isMobileSimplified && (
        <div className="settings-field">
          <div className="settings-field-label">{t('server.tailscale_helper')}</div>
          <div className="settings-field-row">
            <button
              type="button"
              className="button settings-button-compact"
              onClick={onRefreshTailscaleStatus}
              disabled={tailscaleStatusBusy}
            >
              {tailscaleStatusBusy ? t('server.checking') : t('server.detect_tailscale')}
            </button>
            <button
              type="button"
              className="button settings-button-compact"
              onClick={onRefreshTailscaleCommandPreview}
              disabled={tailscaleCommandBusy}
            >
              {tailscaleCommandBusy ? t('server.refreshing') : t('server.refresh_daemon_command')}
            </button>
            <button
              type="button"
              className="button settings-button-compact"
              disabled={!tailscaleStatus?.suggestedRemoteHost}
              onClick={() => {
                void onUseSuggestedTailscaleHost();
              }}
            >
              {t('server.use_suggested_host')}
            </button>
          </div>
          {tailscaleStatusError && (
            <div className="settings-help settings-help-error">{tailscaleStatusError}</div>
          )}
          {tailscaleStatus && (
            <>
              <div className="settings-help">{tailscaleStatus.message}</div>
              <div className="settings-help">
                {tailscaleStatus.installed
                  ? t('server.tailscale_version', { version: tailscaleStatus.version ?? "unknown" })
                  : t('server.install_tailscale')}
              </div>
              {tailscaleStatus.suggestedRemoteHost && (
                <div className="settings-help" dangerouslySetInnerHTML={{ __html: t('server.suggested_remote_host', { host: tailscaleStatus.suggestedRemoteHost }) }} />
              )}
              {tailscaleStatus.tailnetName && (
                <div className="settings-help" dangerouslySetInnerHTML={{ __html: t('server.tailnet', { name: tailscaleStatus.tailnetName }) }} />
              )}
            </>
          )}
          {tailscaleCommandError && (
            <div className="settings-help settings-help-error">{tailscaleCommandError}</div>
          )}
          {tailscaleCommandPreview && (
            <>
              <div className="settings-help">
                {t('server.command_template')}
              </div>
              <pre className="settings-command-preview">
                <code>{tailscaleCommandPreview.command}</code>
              </pre>
              {!tailscaleCommandPreview.tokenConfigured && (
                <div className="settings-help settings-help-error">
                  {t('server.token_not_configured')}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="settings-help">
        {isMobileSimplified
          ? t('server.mobile_infra_help_tcp')
          : t('server.desktop_infra_help')}
      </div>
    </section>
  );
}