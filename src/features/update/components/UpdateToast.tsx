import { useTranslation } from "react-i18next";
import type { UpdateState } from "../hooks/useUpdater";
import {
  ToastActions,
  ToastBody,
  ToastCard,
  ToastError,
  ToastHeader,
  ToastTitle,
  ToastViewport,
} from "../../design-system/components/toast/ToastPrimitives";

type UpdateToastProps = {
  state: UpdateState;
  onUpdate: () => void;
  onDismiss: () => void;
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function UpdateToast({ state, onUpdate, onDismiss }: UpdateToastProps) {
  const { t } = useTranslation();
  if (state.stage === "idle") {
    return null;
  }

  const totalBytes = state.progress?.totalBytes;
  const downloadedBytes = state.progress?.downloadedBytes ?? 0;
  const percent =
    totalBytes && totalBytes > 0
      ? Math.min(100, (downloadedBytes / totalBytes) * 100)
      : null;

  return (
    <ToastViewport className="update-toasts" role="region" ariaLive="polite">
      <ToastCard className="update-toast" role="status">
        <ToastHeader className="update-toast-header">
          <ToastTitle className="update-toast-title">{t("update.title")}</ToastTitle>
          {state.version ? (
            <div className="update-toast-version">v{state.version}</div>
          ) : null}
        </ToastHeader>
        {state.stage === "checking" && (
          <ToastBody className="update-toast-body">{t("update.checking")}</ToastBody>
        )}
        {state.stage === "available" && (
          <>
            <ToastBody className="update-toast-body">
              {t("update.available")}
            </ToastBody>
            <ToastActions className="update-toast-actions">
              <button className="secondary" onClick={onDismiss}>
                {t("update.later")}
              </button>
              <button className="primary" onClick={onUpdate}>
                {t("update.update_now")}
              </button>
            </ToastActions>
          </>
        )}
        {state.stage === "latest" && (
          <div className="update-toast-inline">
            <ToastBody className="update-toast-body update-toast-body-inline">
              {t("update.latest")}
            </ToastBody>
            <button className="secondary" onClick={onDismiss}>
              {t("update.close")}
            </button>
          </div>
        )}
        {state.stage === "downloading" && (
          <>
            <ToastBody className="update-toast-body">
              {t("update.downloading")}
            </ToastBody>
            <div className="update-toast-progress">
              <div className="update-toast-progress-bar">
                <span
                  className="update-toast-progress-fill"
                  style={{ width: percent ? `${percent}%` : "24%" }}
                />
              </div>
              <div className="update-toast-progress-meta">
                {totalBytes
                  ? `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`
                  : t("update.downloaded", { size: formatBytes(downloadedBytes) })}
              </div>
            </div>
          </>
        )}
        {state.stage === "installing" && (
          <ToastBody className="update-toast-body">{t("update.installing")}</ToastBody>
        )}
        {state.stage === "restarting" && (
          <ToastBody className="update-toast-body">{t("update.restarting")}</ToastBody>
        )}
        {state.stage === "error" && (
          <>
            <ToastBody className="update-toast-body">{t("update.failed")}</ToastBody>
            {state.error ? (
              <ToastError className="update-toast-error">{state.error}</ToastError>
            ) : null}
            <ToastActions className="update-toast-actions">
              <button className="secondary" onClick={onDismiss}>
                {t("update.close")}
              </button>
              <button className="primary" onClick={onUpdate}>
                {t("update.retry")}
              </button>
            </ToastActions>
          </>
        )}
      </ToastCard>
    </ToastViewport>
  );
}
