// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSyncSelectedDiffPath } from "./useSyncSelectedDiffPath";

describe("useSyncSelectedDiffPath", () => {
  it("selects the first pull request diff when no diff is selected", () => {
    const setSelectedDiffPath = vi.fn();

    renderHook(() =>
      useSyncSelectedDiffPath({
        diffSource: "pr",
        centerMode: "diff",
        gitPullRequestDiffs: [
          {
            path: "src/main.ts",
            status: "modified",
            diff: "@@ -1 +1 @@",
          },
        ],
        gitCommitDiffs: [],
        perFileDiffGroups: [],
        selectedDiffPath: null,
        setSelectedDiffPath,
      }),
    );

    expect(setSelectedDiffPath).toHaveBeenCalledWith("src/main.ts");
  });

  it("re-selects the first commit diff when current selection is stale", () => {
    const setSelectedDiffPath = vi.fn();

    renderHook(() =>
      useSyncSelectedDiffPath({
        diffSource: "commit",
        centerMode: "diff",
        gitPullRequestDiffs: [],
        gitCommitDiffs: [
          {
            path: "src/main.ts",
            status: "modified",
            diff: "@@ -1 +1 @@",
          },
        ],
        perFileDiffGroups: [],
        selectedDiffPath: "src/old.ts",
        setSelectedDiffPath,
      }),
    );

    expect(setSelectedDiffPath).toHaveBeenCalledWith("src/main.ts");
  });

  it("keeps current commit selection when it is still valid", () => {
    const setSelectedDiffPath = vi.fn();

    renderHook(() =>
      useSyncSelectedDiffPath({
        diffSource: "commit",
        centerMode: "diff",
        gitPullRequestDiffs: [],
        gitCommitDiffs: [
          {
            path: "src/main.ts",
            status: "modified",
            diff: "@@ -1 +1 @@",
          },
        ],
        perFileDiffGroups: [],
        selectedDiffPath: "src/main.ts",
        setSelectedDiffPath,
      }),
    );

    expect(setSelectedDiffPath).not.toHaveBeenCalled();
  });
});
