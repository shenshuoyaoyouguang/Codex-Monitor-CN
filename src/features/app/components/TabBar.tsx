import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import MessagesSquare from "lucide-react/dist/esm/icons/messages-square";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";

type TabKey = "home" | "projects" | "codex" | "git" | "log";

type TabBarProps = {
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
};

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  const { t } = useTranslation();
  const tabs: { id: TabKey; labelKey: string; icon: ReactNode }[] = [
    { id: "projects", labelKey: "tabs.workspaces", icon: <FolderKanban className="tabbar-icon" /> },
    { id: "codex", labelKey: "sidebar.codex", icon: <MessagesSquare className="tabbar-icon" /> },
    { id: "git", labelKey: "git.branches", icon: <GitBranch className="tabbar-icon" /> },
    { id: "log", labelKey: "tabs.log", icon: <TerminalSquare className="tabbar-icon" /> },
  ];
  return (
    <nav className="tabbar" aria-label={t("tabs.main_navigation")}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tabbar-item ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onSelect(tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.icon}
          <span className="tabbar-label">{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
