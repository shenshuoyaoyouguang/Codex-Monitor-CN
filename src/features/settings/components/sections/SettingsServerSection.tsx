import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppSettings } from "@/types";
import type { SettingsServerSectionProps } from "../../hooks/useSettingsServerSection";

type SettingsServerSectionInnerProps = SettingsServerSectionProps & {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
};

export function SettingsServerSection({
  appSettings,
  onUpdateAppSettings,
  isMobilePlatform,
  mobileConnectBusy,
  mobileConnectStatusText,
  mobileConnectStatusError,
  remoteBackends,
  activeRemoteBackendId,
  remoteStatusText,
  remoteStatusError,
  remoteNameError,
  remoteHostError,
  remoteNameDraft,
  remoteHostDraft,
  remoteTokenDraft,
  nextRemoteNameSuggestion,
  tailscaleStatus,
  tailscaleStatusBusy,
  tailscaleStatusError,
  tailscaleCommandPreview,
  tailscaleCommandBusy,
  tailscaleCommandError,
  tcpDaemonStatus,
  tcpDaemonBusyAction,
  onSetRemoteNameDraft,
  onSetRemoteHostDraft,
  onSetRemoteTokenDraft,
  onCommitRemoteName,
  onCommitRemoteHost,
  onCommitRemoteToken,
  onSelectRemoteBackend,
  onAddRemoteBackend,
  onMoveRemoteBackend,
  onDeleteRemoteBackend,
  onRefreshTailscaleStatus,
  onRefreshTailscaleCommandPreview,
  onUseSuggestedTailscaleHost,
  onTcpDaemonStart,
  onTcpDaemonStop,
  onTcpDaemonStatus,
  onMobileConnectTest,
}: SettingsServerSectionInnerProps) {
  const isMobileSimplified = isMobilePlatform;
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addNameDraft, setAddNameDraft] = useState("");
  const [addHostDraft, setAddHostDraft] = useState("");
  const [addTokenDraft, setAddTokenDraft] = useState("");

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

  const handleAddBackend = () => {
    void onAddRemoteBackend({
      name: addNameDraft || nextRemoteNameSuggestion,
      host: addHostDraft,
      token: addTokenDraft,
    });
    setAddNameDraft("");
    setAddHostDraft("");
    setAddTokenDraft("");
    setShowAddModal(false);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddNameDraft("");
    setAddHostDraft("");
    setAddTokenDraft("");
  };

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

      {/* Remote backends list */}
      {isMobileSimplified ? (
        // Mobile: Saved remotes list with name editing
        <div className="settings-field">
          <div className="settings-field-label">{t('server.saved_remotes')}</div>
          <ul className="settings-remote-backends-list" aria-label={t('server.saved_remotes')}>
            {remoteBackends.map((backend) => (
              <li key={backend.id} className="settings-remote-backend-item">
                <button
                  type="button"
                  className={`settings-remote-backend-select ${backend.id === activeRemoteBackendId ? "active" : ""}`}
                  onClick={() => void onSelectRemoteBackend(backend.id)}
                  aria-pressed={backend.id === activeRemoteBackendId}
                  aria-label={t('server.use_remote', { name: backend.name })}
                >
                  <span className="settings-remote-backend-name">{backend.name}</span>
                  <span className="settings-remote-backend-host">{backend.host}</span>
                </button>
                <div className="settings-remote-backend-meta">
                  {backend.lastConnectedAtMs ? (
                    <span>{t('server.last_connected', { time: new Date(backend.lastConnectedAtMs).toLocaleString() })}</span>
                  ) : (
                    <span>{t('server.last_connected_never')}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Remote name editing */}
          <div className="settings-field-row">
            <input
              className="settings-input settings-input--compact"
              value={remoteNameDraft}
              placeholder={nextRemoteNameSuggestion}
              onChange={(event) => onSetRemoteNameDraft(event.target.value)}
              onBlur={() => void onCommitRemoteName()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onCommitRemoteName();
                }
              }}
              aria-label={t('server.remote_name')}
            />
          </div>
          {remoteNameError && (
            <div className="settings-help settings-help-error">{remoteNameError}</div>
          )}

          {/* Add remote button */}
          <button
            type="button"
            className="button settings-button-compact"
            onClick={() => setShowAddModal(true)}
          >
            {t('server.add_remote')}
          </button>
        </div>
      ) : (
        // Desktop: Backend list with actions
        remoteBackends.length > 0 && (
          <div className="settings-field">
            <div className="settings-field-label">{t('server.remote_backends')}</div>
            <div className="settings-remote-backends-list">
              {remoteBackends.map((backend, index) => (
                <div
                  key={backend.id}
                  className={`settings-remote-backend-item ${backend.id === activeRemoteBackendId ? "active" : ""}`}
                >
                  <button
                    type="button"
                    className="settings-remote-backend-select"
                    onClick={() => void onSelectRemoteBackend(backend.id)}
                    aria-pressed={backend.id === activeRemoteBackendId}
                  >
                    <span className="settings-remote-backend-name">{backend.name}</span>
                    <span className="settings-remote-backend-host">{backend.host}</span>
                  </button>
                  <div className="settings-remote-backend-actions">
                    <button
                      type="button"
                      className="button settings-button-icon"
                      onClick={() => void onMoveRemoteBackend(backend.id, "up")}
                      disabled={index === 0}
                      aria-label={t('server.move_up')}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="button settings-button-icon"
                      onClick={() => void onMoveRemoteBackend(backend.id, "down")}
                      disabled={index === remoteBackends.length - 1}
                      aria-label={t('server.move_down')}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="button settings-button-icon"
                      onClick={() => void onDeleteRemoteBackend(backend.id)}
                      disabled={remoteBackends.length <= 1}
                      aria-label={t('server.delete_backend')}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new backend form */}
            {!showAddModal ? (
              <button
                type="button"
                className="button settings-button-compact"
                onClick={() => setShowAddModal(true)}
              >
                {t('server.add_remote_backend')}
              </button>
            ) : (
              <div className="settings-add-remote-backend-form">
                <div className="settings-field-row">
                  <input
                    className="settings-input settings-input--compact"
                    value={addNameDraft}
                    placeholder={nextRemoteNameSuggestion}
                    onChange={(event) => setAddNameDraft(event.target.value)}
                    aria-label={t('server.remote_backend_name')}
                  />
                </div>
                <div className="settings-field-row">
                  <input
                    className="settings-input settings-input--compact"
                    value={addHostDraft}
                    placeholder="127.0.0.1:4732"
                    onChange={(event) => setAddHostDraft(event.target.value)}
                    aria-label={t('settings.features.host')}
                  />
                  <input
                    type="password"
                    className="settings-input settings-input--compact"
                    value={addTokenDraft}
                    placeholder="Token (required)"
                    onChange={(event) => setAddTokenDraft(event.target.value)}
                    aria-label={t('server.remote_backend_token')}
                  />
                </div>
                <div className="settings-field-row">
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={handleAddBackend}
                    disabled={!addHostDraft || !addTokenDraft}
                  >
                    {t('server.add_backend')}
                  </button>
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={handleCloseAddModal}
                  >
                    {t('server.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Add remote modal for mobile */}
      {isMobileSimplified && showAddModal && (
        <div className="settings-modal-overlay" role="dialog" aria-label={t('server.add_remote')}>
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h3>{t('server.add_remote')}</h3>
              <button
                type="button"
                className="button settings-button-icon"
                onClick={handleCloseAddModal}
                aria-label={t('server.close_add_remote_modal')}
              >
                ×
              </button>
            </div>
            <div className="settings-modal-body">
              <div className="settings-field">
                <input
                  className="settings-input"
                  value={addNameDraft}
                  placeholder={nextRemoteNameSuggestion}
                  onChange={(event) => setAddNameDraft(event.target.value)}
                  aria-label={t('server.new_remote_name')}
                />
              </div>
              <div className="settings-field">
                <input
                  className="settings-input"
                  value={addHostDraft}
                  placeholder="host:port"
                  onChange={(event) => setAddHostDraft(event.target.value)}
                  aria-label={t('server.new_remote_host')}
                />
              </div>
              <div className="settings-field">
                <input
                  type="password"
                  className="settings-input"
                  value={addTokenDraft}
                  placeholder="Token"
                  onChange={(event) => setAddTokenDraft(event.target.value)}
                  aria-label={t('server.new_remote_token')}
                />
              </div>
            </div>
            <div className="settings-modal-footer">
              <button
                type="button"
                className="button"
                onClick={handleAddBackend}
                disabled={!addHostDraft || !addTokenDraft}
              >
                {t('server.connect_and_add')}
              </button>
              <button
                type="button"
                className="button"
                onClick={handleCloseAddModal}
              >
                {t('server.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active remote backend editing - always visible */}
      <div className="settings-field">
        <div className="settings-field-label">
          {isMobileSimplified ? t('server.connection_type') : t('server.active_remote_backend')}
        </div>
        <div className="settings-field-row">
          <input
            className="settings-input settings-input--compact"
            value={remoteHostDraft}
            placeholder="127.0.0.1:4732"
            onChange={(event) => onSetRemoteHostDraft(event.target.value)}
            onBlur={() => void onCommitRemoteHost()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitRemoteHost();
              }
            }}
            aria-label={t('server.remote_backend_host')}
          />
          <input
            type="password"
            className="settings-input settings-input--compact"
            value={remoteTokenDraft}
            placeholder="Token (required)"
            onChange={(event) => onSetRemoteTokenDraft(event.target.value)}
            onBlur={() => void onCommitRemoteToken()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitRemoteToken();
              }
            }}
            aria-label={t('server.remote_backend_token')}
          />
        </div>
        {remoteHostError && (
          <div className="settings-help settings-help-error">{remoteHostError}</div>
        )}
        {remoteStatusText && (
          <div className={`settings-help${remoteStatusError ? " settings-help-error" : ""}`}>
            {remoteStatusText}
          </div>
        )}
        <div className="settings-help">
          {isMobileSimplified
            ? t('server.use_tcp_help_mobile')
            : t('server.host_token_help_desktop')}
        </div>
      </div>

      {/* Mobile connect test */}
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

      {/* Desktop daemon controls */}
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

      {!isMobileSimplified && (
        <div className="settings-field">
          <div className="settings-field-label">{t('server.mobile_access_daemon')}</div>
          <div className="settings-field-row">
            <button
              type="button"
              className="button settings-button-compact"
              onClick={() => void onTcpDaemonStart()}
              disabled={tcpDaemonBusyAction !== null}
            >
              {tcpDaemonBusyAction === "start" ? t('server.starting') : t('server.start_daemon')}
            </button>
            <button
              type="button"
              className="button settings-button-compact"
              onClick={() => void onTcpDaemonStop()}
              disabled={tcpDaemonBusyAction !== null}
            >
              {tcpDaemonBusyAction === "stop" ? t('server.stopping') : t('server.stop_daemon')}
            </button>
            <button
              type="button"
              className="button settings-button-compact"
              onClick={() => void onTcpDaemonStatus()}
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

      {/* Tailscale helper - desktop only */}
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
              onClick={() => void onUseSuggestedTailscaleHost()}
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
