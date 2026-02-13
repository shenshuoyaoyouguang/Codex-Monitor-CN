import i18next from '../i18n/config';
import { Locale } from '../i18n/config';

export interface I18nService {
  changeLanguage: (locale: Locale) => Promise<void>;
  getCurrentLanguage: () => Locale;
  t: (key: string, options?: any) => string;
  getMenuTexts: () => Record<string, string>;
}

// 菜单翻译键列表
const MENU_TEXT_KEYS = [
  'app_name',
  'about',
  'check_updates',
  'settings',
  'services',
  'hide',
  'hide_others',
  'quit',
  'file',
  'edit',
  'composer',
  'view',
  'window',
  'help',
  'new_agent',
  'new_worktree_agent',
  'new_clone_agent',
  'add_workspaces',
  'close_window',
  'undo',
  'redo',
  'cut',
  'copy',
  'paste',
  'select_all',
  'cycle_model',
  'cycle_access_mode',
  'cycle_reasoning_mode',
  'cycle_collaboration_mode',
  'toggle_projects_sidebar',
  'toggle_git_sidebar',
  'toggle_debug_panel',
  'toggle_terminal',
  'next_agent',
  'previous_agent',
  'next_workspace',
  'previous_workspace',
  'toggle_full_screen',
  'minimize',
  'maximize',
];

class I18nServiceImpl implements I18nService {
  async changeLanguage(locale: Locale): Promise<void> {
    await i18next.changeLanguage(locale);
    // 语言切换后自动更新菜单
    await this.updateMenuLanguage();
  }

  getCurrentLanguage(): Locale {
    return i18next.language as Locale;
  }

  t(key: string, options?: any): string {
    return i18next.t(key, options) as string;
  }

  // 获取所有菜单翻译文本
  getMenuTexts(): Record<string, string> {
    const texts: Record<string, string> = {};
    for (const key of MENU_TEXT_KEYS) {
      texts[key] = this.t(`menu.${key}`);
    }
    return texts;
  }

  // 更新菜单语言
  private async updateMenuLanguage(): Promise<void> {
    try {
      const { updateMenuTexts } = await import('./tauri');
      const menuTexts = this.getMenuTexts();
      await updateMenuTexts(menuTexts);
    } catch (error) {
      console.warn('Failed to update menu language:', error);
    }
  }
}

export const i18nService: I18nService = new I18nServiceImpl();

// 导出获取菜单文本的独立函数，供外部使用
export function getMenuTexts(): Record<string, string> {
  return i18nService.getMenuTexts();
}
