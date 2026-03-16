import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceInfo } from "../../../types";
import { getGitRemote } from "../../../services/tauri";

type GitRemoteState = {
  remote: string | null;
  error: string | null;
};

type GitRemoteResult = GitRemoteState & {
  refresh: () => void;
};

const emptyState: GitRemoteState = {
  remote: null,
  error: null,
};

export function useGitRemote(activeWorkspace: WorkspaceInfo | null): GitRemoteResult {
  const [state, setState] = useState<GitRemoteState>(emptyState);
  const workspaceIdRef = useRef<string | null>(activeWorkspace?.id ?? null);
  const isActiveRef = useRef(true);

  const fetchRemote = useCallback(async (workspaceId: string) => {
    try {
      const remote = await getGitRemote(workspaceId);
      if (!isActiveRef.current) {
        return;
      }
      setState({ remote, error: null });
    } catch (error) {
      if (!isActiveRef.current) {
        return;
      }
      setState({
        remote: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  const refresh = useCallback(() => {
    const workspaceId = activeWorkspace?.id;
    if (workspaceId) {
      setState(emptyState);
      void fetchRemote(workspaceId);
    }
  }, [activeWorkspace?.id, fetchRemote]);

  useEffect(() => {
    isActiveRef.current = true;
    const workspaceId = activeWorkspace?.id ?? null;
    if (!workspaceId) {
      setState(emptyState);
      return;
    }
    if (workspaceIdRef.current !== workspaceId) {
      workspaceIdRef.current = workspaceId;
      setState(emptyState);
    }
    void fetchRemote(workspaceId);
    return () => {
      isActiveRef.current = false;
    };
  }, [activeWorkspace?.id, fetchRemote]);

  return { ...state, refresh };
}
