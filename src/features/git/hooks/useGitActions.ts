import { useCallback, useEffect, useRef, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  applyWorktreeChanges as applyWorktreeChangesService,
  createGitHubRepo as createGitHubRepoService,
  initGitRepo as initGitRepoService,
  revertGitAll,
  revertGitFile as revertGitFileService,
  stageGitAll as stageGitAllService,
  stageGitFile as stageGitFileService,
  unstageGitFile as unstageGitFileService,
} from "../../../services/tauri";
import type { WorkspaceInfo } from "../../../types";

export type InitGitRepoOutcome = "initialized" | "already_initialized" | "cancelled" | "failed";

type UseGitActionsOptions = {
  activeWorkspace: WorkspaceInfo | null;
  onRefreshGitStatus: () => void;
  onRefreshGitDiffs: () => void;
  onClearGitRootCandidates?: () => void;
  onError?: (error: unknown) => void;
};

export function useGitActions({
  activeWorkspace,
  onRefreshGitStatus,
  onRefreshGitDiffs,
  onClearGitRootCandidates,
  onError,
}: UseGitActionsOptions) {
  const [worktreeApplyError, setWorktreeApplyError] = useState<string | null>(null);
  const [worktreeApplyLoading, setWorktreeApplyLoading] = useState(false);
  const [worktreeApplySuccess, setWorktreeApplySuccess] = useState(false);
  const [initGitRepoLoading, setInitGitRepoLoading] = useState(false);
  const [createGitHubRepoLoading, setCreateGitHubRepoLoading] = useState(false);
  const worktreeApplyTimerRef = useRef<number | null>(null);
  const workspaceIdRef = useRef<string | null>(activeWorkspace?.id ?? null);
  const workspaceId = activeWorkspace?.id ?? null;
  const isWorktree = activeWorkspace?.kind === "worktree";

  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  useEffect(() => {
    setWorktreeApplyError(null);
    setWorktreeApplyLoading(false);
    setWorktreeApplySuccess(false);
    if (worktreeApplyTimerRef.current) {
      window.clearTimeout(worktreeApplyTimerRef.current);
      worktreeApplyTimerRef.current = null;
    }
  }, [workspaceId]);

  const refreshGitData = useCallback(() => {
    onRefreshGitStatus();
    onRefreshGitDiffs();
  }, [onRefreshGitDiffs, onRefreshGitStatus]);

  const stageGitFile = useCallback(
    async (path: string) => {
      if (!workspaceId) {
        return;
      }
      const actionWorkspaceId = workspaceId;
      try {
        await stageGitFileService(actionWorkspaceId, path);
      } catch (error) {
        onError?.(error);
      } finally {
        if (workspaceIdRef.current === actionWorkspaceId) {
          refreshGitData();
        }
      }
    },
    [onError, refreshGitData, workspaceId],
  );

  const stageGitAll = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    const actionWorkspaceId = workspaceId;
    try {
      await stageGitAllService(actionWorkspaceId);
    } catch (error) {
      onError?.(error);
    } finally {
      if (workspaceIdRef.current === actionWorkspaceId) {
        refreshGitData();
      }
    }
  }, [onError, refreshGitData, workspaceId]);

  const unstageGitFile = useCallback(
    async (path: string) => {
      if (!workspaceId) {
        return;
      }
      const actionWorkspaceId = workspaceId;
      try {
        await unstageGitFileService(actionWorkspaceId, path);
      } catch (error) {
        onError?.(error);
      } finally {
        if (workspaceIdRef.current === actionWorkspaceId) {
          refreshGitData();
        }
      }
    },
    [onError, refreshGitData, workspaceId],
  );

  const revertGitFile = useCallback(
    async (path: string) => {
      if (!workspaceId) {
        return;
      }
      const actionWorkspaceId = workspaceId;
      try {
        await revertGitFileService(actionWorkspaceId, path);
      } catch (error) {
        onError?.(error);
      } finally {
        if (workspaceIdRef.current === actionWorkspaceId) {
          refreshGitData();
        }
      }
    },
    [onError, refreshGitData, workspaceId],
  );

  const revertAllGitChanges = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    const confirmed = await ask(
      "要还原此仓库的所有更改吗？\n\n这将丢弃所有已暂存和未暂存的更改，包括未跟踪文件。",
      { title: "还原所有更改", kind: "warning" },
    );
    if (!confirmed) {
      return;
    }
    try {
      await revertGitAll(workspaceId);
      refreshGitData();
    } catch (error) {
      onError?.(error);
    }
  }, [onError, refreshGitData, workspaceId]);

  const applyWorktreeChanges = useCallback(async () => {
    if (!workspaceId || !isWorktree) {
      return;
    }
    const applyWorkspaceId = workspaceId;
    setWorktreeApplyError(null);
    setWorktreeApplySuccess(false);
    setWorktreeApplyLoading(true);
    try {
      await applyWorktreeChangesService(applyWorkspaceId);
      if (workspaceIdRef.current !== applyWorkspaceId) {
        return;
      }
      if (worktreeApplyTimerRef.current) {
        window.clearTimeout(worktreeApplyTimerRef.current);
      }
      setWorktreeApplySuccess(true);
      worktreeApplyTimerRef.current = window.setTimeout(() => {
        if (workspaceIdRef.current !== applyWorkspaceId) {
          return;
        }
        setWorktreeApplySuccess(false);
        worktreeApplyTimerRef.current = null;
      }, 2500);
    } catch (error) {
      if (workspaceIdRef.current !== applyWorkspaceId) {
        return;
      }
      setWorktreeApplyError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      if (workspaceIdRef.current === applyWorkspaceId) {
        setWorktreeApplyLoading(false);
      }
    }
  }, [isWorktree, workspaceId]);

  const initGitRepo = useCallback(
    async (branch: string): Promise<InitGitRepoOutcome> => {
      if (!workspaceId) {
        return "failed";
      }
      const initWorkspaceId = workspaceId;
      setInitGitRepoLoading(true);
      try {
        const result = await initGitRepoService(initWorkspaceId, branch, false);
        if (workspaceIdRef.current !== initWorkspaceId) {
          return "cancelled";
        }
        if (result.status === "already_initialized") {
          return "already_initialized";
        }
        if (result.status === "needs_confirmation") {
          const confirmed = await ask(
            `此文件夹包含 ${result.entryCount} 个文件。确定要初始化 Git 仓库吗？`,
            { title: "初始化 Git", kind: "warning" },
          );
          if (!confirmed) {
            return "cancelled";
          }
          const forceResult = await initGitRepoService(initWorkspaceId, branch, true);
          if (forceResult.status === "initialized" || forceResult.status === "already_initialized") {
            onClearGitRootCandidates?.();
            refreshGitData();
            return "initialized";
          }
          return "failed";
        }
        onClearGitRootCandidates?.();
        refreshGitData();
        return "initialized";
      } catch (error) {
        if (workspaceIdRef.current !== initWorkspaceId) {
          return "cancelled";
        }
        onError?.(error);
        return "failed";
      } finally {
        if (workspaceIdRef.current === initWorkspaceId) {
          setInitGitRepoLoading(false);
        }
      }
    },
    [onClearGitRootCandidates, onError, refreshGitData, workspaceId],
  );

  const createGitHubRepo = useCallback(
    async (
      repo: string,
      visibility: "private" | "public",
      branch: string,
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!workspaceId) {
        return { ok: false, error: "No active workspace" };
      }
      const createWorkspaceId = workspaceId;
      setCreateGitHubRepoLoading(true);
      try {
        const result = await createGitHubRepoService(
          createWorkspaceId,
          repo,
          visibility,
          branch,
        );
        if (workspaceIdRef.current !== createWorkspaceId) {
          return { ok: false, error: "Workspace changed during operation" };
        }
        if (result.ok) {
          refreshGitData();
          return { ok: true };
        }
        return { ok: false, error: result.error };
      } catch (error) {
        if (workspaceIdRef.current !== createWorkspaceId) {
          return { ok: false, error: "Workspace changed during operation" };
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        onError?.(error);
        return { ok: false, error: errorMessage };
      } finally {
        if (workspaceIdRef.current === createWorkspaceId) {
          setCreateGitHubRepoLoading(false);
        }
      }
    },
    [onError, refreshGitData, workspaceId],
  );

  return {
    applyWorktreeChanges,
    createGitHubRepo,
    createGitHubRepoLoading,
    initGitRepo,
    initGitRepoLoading,
    revertAllGitChanges,
    revertGitFile,
    stageGitAll,
    stageGitFile,
    unstageGitFile,
    worktreeApplyError,
    worktreeApplyLoading,
    worktreeApplySuccess,
  };
}
