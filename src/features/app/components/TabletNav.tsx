import type { ReactNode } from "react";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import MessagesSquare from "lucide-react/dist/esm/icons/messages-square";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";
import { useTranslation } from "react-i18next";

type TabletNavTab = "codex" | "git" | "log";

type TabletNavProps = {
  activeTab: TabletNavTab;
  onSelect: (tab: TabletNavTab) => void;
};

export function TabletNav({ activeTab, onSelect }: TabletNavProps) {
  const { t } = useTranslation();

  const tabs: { id: TabletNavTab; label: string; icon: ReactNode }[] = [
    { id: "codex", label: t("nav.codex"), icon: <MessagesSquare className="tablet-nav-icon" /> },
    { id: "git", label: t("nav.git"), icon: <GitBranch className="tablet-nav-icon" /> },
    { id: "log", label: t("nav.log"), icon: <TerminalSquare className="tablet-nav-icon" /> },
  ];

  return (
    <nav className="tablet-nav" aria-label={t("aria.workspaceNav")}>
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
            <span className="tablet-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
