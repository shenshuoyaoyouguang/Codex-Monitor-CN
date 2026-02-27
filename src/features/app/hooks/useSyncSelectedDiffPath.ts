import { useEffect } from "react";
import type { GitCommitDiff, GitHubPullRequestDiff } from "../../../types";

type PerFileDiffGroup = {
  path: string;
  edits: Array<{
    id: string;
    path: string;
    label: string;
    status: string;
    diff: string;
    sourceItemId: string;
    additions: number;
    deletions: number;
  }>;
};

type Params = {
  diffSource: "local" | "pr" | "commit" | "perFile";
  centerMode: "chat" | "diff";
  gitPullRequestDiffs: GitHubPullRequestDiff[];
  gitCommitDiffs: GitCommitDiff[];
  perFileDiffGroups?: PerFileDiffGroup[];
  selectedDiffPath: string | null;
  setSelectedDiffPath: (path: string | null) => void;
};

export function useSyncSelectedDiffPath({
  diffSource,
  centerMode,
  gitPullRequestDiffs,
  gitCommitDiffs,
  perFileDiffGroups = [],
  selectedDiffPath,
  setSelectedDiffPath,
}: Params) {
  // perFileDiffGroups is reserved for future use
  void perFileDiffGroups;

  useEffect(() => {
    if (diffSource !== "pr" || centerMode !== "diff") {
      return;
    }
    if (!gitPullRequestDiffs.length) {
      return;
    }
    if (
      selectedDiffPath &&
      gitPullRequestDiffs.some((entry) => entry.path === selectedDiffPath)
    ) {
      return;
    }
    setSelectedDiffPath(gitPullRequestDiffs[0].path);
  }, [
    centerMode,
    diffSource,
    gitPullRequestDiffs,
    selectedDiffPath,
    setSelectedDiffPath,
  ]);

  useEffect(() => {
    if (diffSource !== "commit" || centerMode !== "diff") {
      return;
    }
    if (!gitCommitDiffs.length) {
      return;
    }
    if (
      selectedDiffPath &&
      gitCommitDiffs.some((entry) => entry.path === selectedDiffPath)
    ) {
      return;
    }
    setSelectedDiffPath(gitCommitDiffs[0].path);
  }, [
    centerMode,
    diffSource,
    gitCommitDiffs,
    selectedDiffPath,
    setSelectedDiffPath,
  ]);
}
