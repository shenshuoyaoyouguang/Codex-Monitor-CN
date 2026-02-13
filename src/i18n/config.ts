import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';

export const defaultNS = 'translation';
export const resources = {
  en: {
    [defaultNS]: enTranslation,
  },
  zh: {
    [defaultNS]: zhTranslation,
  },
} as const;

export type Locale = keyof typeof resources;

export const supportedLocales: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

i18next
  .use(initReactI18next)
  .init({
    resources,
    ns: [defaultNS],
    defaultNS,
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// 菜单翻译键列表
const MENU_TEXT_KEYS = [
  'app_name', 'about', 'check_updates', 'settings', 'services',
  'hide', 'hide_others', 'quit', 'file', 'edit', 'composer',
  'view', 'window', 'help', 'new_agent', 'new_worktree_agent',
  'new_clone_agent', 'add_workspaces', 'close_window', 'undo',
  'redo', 'cut', 'copy', 'paste', 'select_all', 'cycle_model',
  'cycle_access_mode', 'cycle_reasoning_mode', 'cycle_collaboration_mode',
  'toggle_projects_sidebar', 'toggle_git_sidebar', 'toggle_debug_panel',
  'toggle_terminal', 'next_agent', 'previous_agent', 'next_workspace',
  'previous_workspace', 'toggle_full_screen', 'minimize', 'maximize',
];

// 更新菜单文本
async function updateMenuLanguage() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const texts: Record<string, string> = {};
    for (const key of MENU_TEXT_KEYS) {
      texts[key] = i18next.t(`menu.${key}`);
    }
    await invoke('update_menu_texts', { texts });
  } catch (error) {
    // 在非 Tauri 环境或更新失败时忽略
    console.warn('Failed to update menu language:', error);
  }
}

// 监听语言变化，自动更新菜单
i18next.on('languageChanged', () => {
  void updateMenuLanguage();
});

export default i18next;
