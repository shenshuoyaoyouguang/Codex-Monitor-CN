import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import MessagesSquare from "lucide-react/dist/esm/icons/messages-square";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";

type TabletNavTab = "codex" | "git" | "log";

type TabletNavProps = {
  activeTab: TabletNavTab;
  onSelect: (tab: TabletNavTab) => void;
};

export function TabletNav({ activeTab, onSelect }: TabletNavProps) {
  const { t } = useTranslation();
  const tabs: { id: TabletNavTab; labelKey: string; icon: ReactNode }[] = [
    { id: "codex", labelKey: "sidebar.codex", icon: <MessagesSquare className="tablet-nav-icon" /> },
    { id: "git", labelKey: "git.branches", icon: <GitBranch className="tablet-nav-icon" /> },
    { id: "log", labelKey: "tabs.log", icon: <TerminalSquare className="tablet-nav-icon" /> },
  ];
  return (
    <nav className="tablet-nav" aria-label={t("tabs.workspaces")}>
      <div className="tablet-nav-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tablet-nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onSelect(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.icon}
            <span className="tablet-nav-label">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
