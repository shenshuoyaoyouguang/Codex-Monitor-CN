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

// 菜单翻译键列表 (使用 Rust 中注册的菜单项 ID)
const MENU_TEXT_KEYS = [
  'app_name', 'about', 'check_for_updates', 'file_open_settings', 'services',
  'hide', 'hide_others', 'quit', 'file', 'edit', 'composer',
  'view', 'window', 'help', 'file_new_agent', 'file_new_worktree_agent',
  'file_new_clone_agent', 'file_add_workspaces', 'file_close_window', 'undo',
  'redo', 'cut', 'copy', 'paste', 'select_all', 'composer_cycle_model',
  'composer_cycle_access', 'composer_cycle_reasoning', 'composer_cycle_collaboration',
  'view_toggle_projects_sidebar', 'view_toggle_git_sidebar', 'view_toggle_debug_panel',
  'view_toggle_terminal', 'view_next_agent', 'view_prev_agent', 'view_next_workspace',
  'view_prev_workspace', 'view_fullscreen', 'window_minimize', 'window_maximize',
  'window_close', 'help_about',
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
