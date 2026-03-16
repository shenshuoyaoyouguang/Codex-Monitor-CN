/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerInput } from "./ComposerInput";

// Mock i18n modules
vi.mock("@/i18n", () => ({
  default: {
    language: "en",
    changeLanguage: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "composer.cancelTranscription") return "Cancel transcription";
      if (key === "composer.stopDictation") return "Stop dictation";
      if (key === "composer.startDictation") return "Start dictation";
      if (key === "composer.addImage") return "Add image";
      if (key === "composer.moreActions") return "More actions";
      if (key === "composer.send") return "Send";
      if (key === "composer.stop") return "Stop";
      if (key === "composer.expandInput") return "Expand input";
      if (key === "composer.collapseInput") return "Collapse input";
      if (key === "composer.openDictationSettings") return "Open dictation settings";
      if (key === "composer.dictationDisabled") return "Dictation disabled. Open settings";
      if (key === "composer.dismiss") return "Dismiss";
      if (key === "composer.placeholder.default") return "Ask Codex to do something...";
      return key;
    },
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
    use: () => ({ init: vi.fn() }),
  },
}));

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
  it("uses the mic control to cancel transcription while processing", () => {
    const onToggleDictation = vi.fn();
    const onCancelDictation = vi.fn();
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
        onCancelDictation={onCancelDictation}
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

    const cancelButton = screen.getByRole("button", {
      name: "Cancel transcription",
    });
    fireEvent.click(cancelButton);

    expect(onCancelDictation).toHaveBeenCalledTimes(1);
    expect(onToggleDictation).not.toHaveBeenCalled();
    expect(onOpenDictationSettings).not.toHaveBeenCalled();
  });
});
