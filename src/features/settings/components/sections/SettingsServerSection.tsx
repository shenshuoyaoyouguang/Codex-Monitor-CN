import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type {
  AppSettings,
  TailscaleDaemonCommandPreview,
  TailscaleStatus,
  TcpDaemonStatus,
} from "@/types";

type SettingsServerSectionProps = {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  isMobilePlatform: boolean;
  mobileConnectBusy: boolean;
  mobileConnectStatusText: string | null;
  mobileConnectStatusError: boolean;
  remoteHostDraft: string;
  remoteTokenDraft: string;
  orbitWsUrlDraft: string;
  orbitAuthUrlDraft: string;
  orbitRunnerNameDraft: string;
  orbitAccessClientIdDraft: string;
  orbitAccessClientSecretRefDraft: string;
  orbitStatusText: string | null;
  orbitAuthCode: string | null;
  orbitVerificationUrl: string | null;
  orbitBusyAction: string | null;
  tailscaleStatus: TailscaleStatus | null;
  tailscaleStatusBusy: boolean;
  tailscaleStatusError: string | null;
  tailscaleCommandPreview: TailscaleDaemonCommandPreview | null;
  tailscaleCommandBusy: boolean;
  tailscaleCommandError: string | null;
  tcpDaemonStatus: TcpDaemonStatus | null;
  tcpDaemonBusyAction: "start" | "stop" | "status" | null;
  onSetRemoteHostDraft: Dispatch<SetStateAction<string>>;
  onSetRemoteTokenDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitWsUrlDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitAuthUrlDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitRunnerNameDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitAccessClientIdDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitAccessClientSecretRefDraft: Dispatch<SetStateAction<string>>;
  onCommitRemoteHost: () => Promise<void>;
  onCommitRemoteToken: () => Promise<void>;
  onChangeRemoteProvider: (provider: AppSettings["remoteBackendProvider"]) => Promise<void>;
  onRefreshTailscaleStatus: () => void;
  onRefreshTailscaleCommandPreview: () => void;
  onUseSuggestedTailscaleHost: () => Promise<void>;
  onTcpDaemonStart: () => Promise<void>;
  onTcpDaemonStop: () => Promise<void>;
  onTcpDaemonStatus: () => Promise<void>;
  onCommitOrbitWsUrl: () => Promise<void>;
  onCommitOrbitAuthUrl: () => Promise<void>;
  onCommitOrbitRunnerName: () => Promise<void>;
  onCommitOrbitAccessClientId: () => Promise<void>;
  onCommitOrbitAccessClientSecretRef: () => Promise<void>;
  onOrbitConnectTest: () => void;
  onOrbitSignIn: () => void;
  onOrbitSignOut: () => void;
  onOrbitRunnerStart: () => void;
  onOrbitRunnerStop: () => void;
  onOrbitRunnerStatus: () => void;
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
  orbitWsUrlDraft,
  orbitAuthUrlDraft,
  orbitRunnerNameDraft,
  orbitAccessClientIdDraft,
  orbitAccessClientSecretRefDraft,
  orbitStatusText,
  orbitAuthCode,
  orbitVerificationUrl,
  orbitBusyAction,
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
  onSetOrbitWsUrlDraft,
  onSetOrbitAuthUrlDraft,
  onSetOrbitRunnerNameDraft,
  onSetOrbitAccessClientIdDraft,
  onSetOrbitAccessClientSecretRefDraft,
  onCommitRemoteHost,
  onCommitRemoteToken,
  onChangeRemoteProvider,
  onRefreshTailscaleStatus,
  onRefreshTailscaleCommandPreview,
  onUseSuggestedTailscaleHost,
  onTcpDaemonStart,
  onTcpDaemonStop,
  onTcpDaemonStatus,
  onCommitOrbitWsUrl,
  onCommitOrbitAuthUrl,
  onCommitOrbitRunnerName,
  onCommitOrbitAccessClientId,
  onCommitOrbitAccessClientSecretRef,
  onOrbitConnectTest,
  onOrbitSignIn,
  onOrbitSignOut,
  onOrbitRunnerStart,
  onOrbitRunnerStop,
  onOrbitRunnerStatus,
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

      <>
        <div className="settings-field">
          <label className="settings-field-label" htmlFor="remote-provider">
            {isMobileSimplified ? t('server.connection_type') : t('server.remote_provider')}
          </label>
          <select
            id="remote-provider"
            className="settings-select"
            value={appSettings.remoteBackendProvider}
            onChange={(event) => {
              void onChangeRemoteProvider(
                event.target.value as AppSettings["remoteBackendProvider"],
              );
            }}
            aria-label={isMobileSimplified ? t('server.connection_type') : t('server.remote_provider')}
          >
            <option value="tcp">{isMobileSimplified ? "TCP" : t('server.tcp_wip')}</option>
            <option value="orbit">{isMobileSimplified ? "Orbit" : t('server.orbit_wip')}</option>
          </select>
          <div className="settings-help">
            {isMobileSimplified
              ? t('server.remote_provider_help_mobile')
              : t('server.remote_provider_help_desktop')}
          </div>
        </div>

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

        {appSettings.remoteBackendProvider === "tcp" && (
          <>
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
          </>
        )}

        {appSettings.remoteBackendProvider === "orbit" && (
          <>
            <div className="settings-field">
              <label className="settings-field-label" htmlFor="orbit-ws-url">
                {t('server.orbit_websocket_url')}
              </label>
              <input
                id="orbit-ws-url"
                className="settings-input settings-input--compact"
                value={orbitWsUrlDraft}
                placeholder="wss://..."
                onChange={(event) => onSetOrbitWsUrlDraft(event.target.value)}
                onBlur={() => {
                  void onCommitOrbitWsUrl();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void onCommitOrbitWsUrl();
                  }
                }}
                aria-label={t('server.orbit_websocket_url')}
              />
            </div>

            {isMobileSimplified && (
              <>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-token-mobile">
                    {t('server.remote_backend_token')}
                  </label>
                  <input
                    id="orbit-token-mobile"
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
                    aria-label={t('server.remote_backend_token')}
                  />
                  <div className="settings-help">
                    {t('server.remote_backend_token_help')}
                  </div>
                </div>
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
                    {t('server.connection_test_help_orbit')}
                  </div>
                </div>
              </>
            )}

            {!isMobileSimplified && (
              <>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-auth-url">
                    {t('server.orbit_auth_url')}
                  </label>
                  <input
                    id="orbit-auth-url"
                    className="settings-input settings-input--compact"
                    value={orbitAuthUrlDraft}
                    placeholder="https://..."
                    onChange={(event) => onSetOrbitAuthUrlDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitAuthUrl();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitAuthUrl();
                      }
                    }}
                    aria-label={t('server.orbit_auth_url')}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-runner-name">
                    {t('server.orbit_runner_name')}
                  </label>
                  <input
                    id="orbit-runner-name"
                    className="settings-input settings-input--compact"
                    value={orbitRunnerNameDraft}
                    placeholder="codex-monitor"
                    onChange={(event) => onSetOrbitRunnerNameDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitRunnerName();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitRunnerName();
                      }
                    }}
                    aria-label={t('server.orbit_runner_name')}
                  />
                </div>

                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t('server.auto_start_runner')}</div>
                    <div className="settings-toggle-subtitle">
                      {t('server.auto_start_runner_subtitle')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.orbitAutoStartRunner ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        orbitAutoStartRunner: !appSettings.orbitAutoStartRunner,
                      })
                    }
                    aria-pressed={appSettings.orbitAutoStartRunner}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>

                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t('server.use_orbit_access')}</div>
                    <div className="settings-toggle-subtitle">
                      {t('server.use_orbit_access_subtitle')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.orbitUseAccess ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        orbitUseAccess: !appSettings.orbitUseAccess,
                      })
                    }
                    aria-pressed={appSettings.orbitUseAccess}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-access-client-id">
                    {t('server.orbit_access_client_id')}
                  </label>
                  <input
                    id="orbit-access-client-id"
                    className="settings-input settings-input--compact"
                    value={orbitAccessClientIdDraft}
                    placeholder="client-id"
                    disabled={!appSettings.orbitUseAccess}
                    onChange={(event) => onSetOrbitAccessClientIdDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitAccessClientId();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitAccessClientId();
                      }
                    }}
                    aria-label={t('server.orbit_access_client_id')}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-access-client-secret-ref">
                    {t('server.orbit_access_client_secret_ref')}
                  </label>
                  <input
                    id="orbit-access-client-secret-ref"
                    className="settings-input settings-input--compact"
                    value={orbitAccessClientSecretRefDraft}
                    placeholder="secret-ref"
                    disabled={!appSettings.orbitUseAccess}
                    onChange={(event) => onSetOrbitAccessClientSecretRefDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitAccessClientSecretRef();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitAccessClientSecretRef();
                      }
                    }}
                    aria-label={t('server.orbit_access_client_secret_ref')}
                  />
                </div>

                <div className="settings-field">
                  <div className="settings-field-label">{t('server.orbit_actions')}</div>
                  <div className="settings-field-row">
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onOrbitConnectTest}
                      disabled={orbitBusyAction !== null}
                    >
                      {orbitBusyAction === "connect-test" ? t('server.testing') : t('server.connect_test')}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onOrbitSignIn}
                      disabled={orbitBusyAction !== null}
                    >
                      {orbitBusyAction === "sign-in" ? t('server.signing_in') : t('server.sign_in')}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onOrbitSignOut}
                      disabled={orbitBusyAction !== null}
                    >
                      {orbitBusyAction === "sign-out" ? t('server.signing_out') : t('server.sign_out')}
                    </button>
                  </div>
                  <div className="settings-field-row">
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onOrbitRunnerStart}
                      disabled={orbitBusyAction !== null}
                    >
                      {orbitBusyAction === "runner-start" ? t('server.starting') : t('server.start_runner')}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onOrbitRunnerStop}
                      disabled={orbitBusyAction !== null}
                    >
                      {orbitBusyAction === "runner-stop" ? t('server.stopping') : t('server.stop_runner')}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onOrbitRunnerStatus}
                      disabled={orbitBusyAction !== null}
                    >
                      {orbitBusyAction === "runner-status" ? t('server.refreshing') : t('server.refresh_status')}
                    </button>
                  </div>
                  {orbitStatusText && <div className="settings-help">{orbitStatusText}</div>}
                  {orbitAuthCode && (
                    <div className="settings-help" dangerouslySetInnerHTML={{ __html: t('server.auth_code', { code: orbitAuthCode }) }} />
                  )}
                  {orbitVerificationUrl && (
                    <div className="settings-help">
                      {t('server.verification_url')}
                      <a href={orbitVerificationUrl} target="_blank" rel="noreferrer">
                        {orbitVerificationUrl}
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </>

      <div className="settings-help">
        {isMobileSimplified
          ? appSettings.remoteBackendProvider === "tcp"
            ? t('server.mobile_infra_help_tcp')
            : t('server.mobile_infra_help_orbit')
          : t('server.desktop_infra_help')}
      </div>
    </section>
  );
}
