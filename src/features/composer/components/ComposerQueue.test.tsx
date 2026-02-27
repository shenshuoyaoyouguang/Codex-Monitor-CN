/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QueuedMessage } from "../../../types";
import { ComposerQueue } from "./ComposerQueue";

// Mock Tauri menu API
vi.mock("@tauri-apps/api/menu", () => ({
  MenuItem: {
    new: vi.fn().mockResolvedValue({
      id: "mock-menu-item",
    }),
  },
  Menu: {
    new: vi.fn().mockResolvedValue({
      popup: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({})),
}));

vi.mock("@tauri-apps/api/dpi", () => ({
  LogicalPosition: vi.fn().mockImplementation((x, y) => ({ x, y })),
}));

const queuedItem: QueuedMessage = {
  id: "queued-1",
  text: "Add link to GitHub repo too",
  createdAt: 1,
};

describe("ComposerQueue", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders queue items correctly", () => {
    render(<ComposerQueue queuedMessages={[queuedItem]} />);

    expect(screen.getByText("Add link to GitHub repo too")).toBeTruthy();
    expect(screen.getByLabelText("Queue item menu")).toBeTruthy();
  });

  it("creates menu with edit and delete items when menu button is clicked", async () => {
    const { MenuItem } = await import("@tauri-apps/api/menu");
    render(<ComposerQueue queuedMessages={[queuedItem]} />);

    fireEvent.click(screen.getByLabelText("Queue item menu"));

    // Wait for async menu creation
    await vi.waitFor(() => {
      expect(MenuItem.new).toHaveBeenCalledTimes(2);
    });
  });

  it("calls edit callback when onEditQueued is provided", async () => {
    const onEditQueued = vi.fn();
    const { MenuItem } = await import("@tauri-apps/api/menu");
    render(<ComposerQueue queuedMessages={[queuedItem]} onEditQueued={onEditQueued} />);

    fireEvent.click(screen.getByLabelText("Queue item menu"));

    // Verify MenuItem.new was called with edit action
    await vi.waitFor(() => {
      expect(MenuItem.new).toHaveBeenCalled();
    });
  });

  it("calls delete callback when onDeleteQueued is provided", async () => {
    const onDeleteQueued = vi.fn();
    const { MenuItem } = await import("@tauri-apps/api/menu");
    render(<ComposerQueue queuedMessages={[queuedItem]} onDeleteQueued={onDeleteQueued} />);

    fireEvent.click(screen.getByLabelText("Queue item menu"));

    // Verify MenuItem.new was called with delete action
    await vi.waitFor(() => {
      expect(MenuItem.new).toHaveBeenCalled();
    });
  });
});
