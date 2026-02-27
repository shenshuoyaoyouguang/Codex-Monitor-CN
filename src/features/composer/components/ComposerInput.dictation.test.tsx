/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerInput } from "./ComposerInput";

vi.mock("../../../services/dragDrop", () => ({
  subscribeWindowDragDrop: vi.fn(() => () => {}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `tauri://${path}`,
}));

afterEach(() => {
  cleanup();
});

describe("ComposerInput dictation controls", () => {
  it("shows processing state on mic button while processing dictation", () => {
    const onToggleDictation = vi.fn();
    const onOpenDictationSettings = vi.fn();
    render(
      <ComposerInput
        text=""
        disabled={false}
        sendLabel="Send"
        canStop={false}
        canSend={false}
        isProcessing={false}
        onStop={() => {}}
        onSend={() => {}}
        dictationState="processing"
        dictationEnabled={true}
        onToggleDictation={onToggleDictation}
        onOpenDictationSettings={onOpenDictationSettings}
        onTextChange={() => {}}
        onSelectionChange={() => {}}
        onKeyDown={() => {}}
        textareaRef={createRef<HTMLTextAreaElement>()}
        suggestionsOpen={false}
        suggestions={[]}
        highlightIndex={0}
        onHighlightIndex={() => {}}
        onSelectSuggestion={() => {}}
      />,
    );

    // In processing state, the mic button shows "Processing..." and is disabled
    const micButton = screen.getByRole("button", {
      name: "Processing...",
    });
    expect(micButton).toBeTruthy();
    expect(micButton).toHaveProperty("disabled", true);
  });
});
