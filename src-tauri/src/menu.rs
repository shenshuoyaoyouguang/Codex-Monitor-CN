use std::collections::HashMap;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::menu::{Menu, MenuItem, MenuItemBuilder, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};

pub struct MenuItemRegistry<R: Runtime> {
    items: Mutex<HashMap<String, MenuItem<R>>>,
}

impl<R: Runtime> Default for MenuItemRegistry<R> {
    fn default() -> Self {
        Self {
            items: Mutex::new(HashMap::new()),
        }
    }
}

impl<R: Runtime> MenuItemRegistry<R> {
    fn register(&self, id: &str, item: &MenuItem<R>) {
        if let Ok(mut items) = self.items.lock() {
            items.insert(id.to_string(), item.clone());
        }
    }

    fn set_accelerator(&self, id: &str, accelerator: Option<&str>) -> tauri::Result<bool> {
        let item = match self.items.lock() {
            Ok(items) => items.get(id).cloned(),
            Err(_) => return Ok(false),
        };
        if let Some(item) = item {
            item.set_accelerator(accelerator)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct MenuAcceleratorUpdate {
    pub id: String,
    pub accelerator: Option<String>,
}

// 菜单文本结构，从前端接收
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuTexts {
    pub app_name: String,
    pub about: String,
    pub check_updates: String,
    pub settings: String,
    pub services: String,
    pub hide: String,
    pub hide_others: String,
    pub quit: String,
    pub file: String,
    pub edit: String,
    pub composer: String,
    pub view: String,
    pub window: String,
    pub help: String,
    pub new_agent: String,
    pub new_worktree_agent: String,
    pub new_clone_agent: String,
    pub add_workspaces: String,
    pub close_window: String,
    pub undo: String,
    pub redo: String,
    pub cut: String,
    pub copy: String,
    pub paste: String,
    pub select_all: String,
    pub cycle_model: String,
    pub cycle_access_mode: String,
    pub cycle_reasoning_mode: String,
    pub cycle_collaboration_mode: String,
    pub toggle_projects_sidebar: String,
    pub toggle_git_sidebar: String,
    pub toggle_debug_panel: String,
    pub toggle_terminal: String,
    pub next_agent: String,
    pub previous_agent: String,
    pub next_workspace: String,
    pub previous_workspace: String,
    pub toggle_full_screen: String,
    pub minimize: String,
    pub maximize: String,
}

impl Default for MenuTexts {
    fn default() -> Self {
        Self {
            app_name: "Codex Monitor".to_string(),
            about: "About Codex Monitor".to_string(),
            check_updates: "Check for Updates...".to_string(),
            settings: "Settings...".to_string(),
            services: "Services".to_string(),
            hide: "Hide".to_string(),
            hide_others: "Hide Others".to_string(),
            quit: "Quit".to_string(),
            file: "File".to_string(),
            edit: "Edit".to_string(),
            composer: "Composer".to_string(),
            view: "View".to_string(),
            window: "Window".to_string(),
            help: "Help".to_string(),
            new_agent: "New Agent".to_string(),
            new_worktree_agent: "New Worktree Agent".to_string(),
            new_clone_agent: "New Clone Agent".to_string(),
            add_workspaces: "Add Workspaces...".to_string(),
            close_window: "Close Window".to_string(),
            undo: "Undo".to_string(),
            redo: "Redo".to_string(),
            cut: "Cut".to_string(),
            copy: "Copy".to_string(),
            paste: "Paste".to_string(),
            select_all: "Select All".to_string(),
            cycle_model: "Cycle Model".to_string(),
            cycle_access_mode: "Cycle Access Mode".to_string(),
            cycle_reasoning_mode: "Cycle Reasoning Mode".to_string(),
            cycle_collaboration_mode: "Cycle Collaboration Mode".to_string(),
            toggle_projects_sidebar: "Toggle Projects Sidebar".to_string(),
            toggle_git_sidebar: "Toggle Git Sidebar".to_string(),
            toggle_debug_panel: "Toggle Debug Panel".to_string(),
            toggle_terminal: "Toggle Terminal".to_string(),
            next_agent: "Next Agent".to_string(),
            previous_agent: "Previous Agent".to_string(),
            next_workspace: "Next Workspace".to_string(),
            previous_workspace: "Previous Workspace".to_string(),
            toggle_full_screen: "Toggle Full Screen".to_string(),
            minimize: "Minimize".to_string(),
            maximize: "Maximize".to_string(),
        }
    }
}

#[tauri::command]
pub fn menu_set_accelerators<R: Runtime>(
    app: tauri::AppHandle<R>,
    updates: Vec<MenuAcceleratorUpdate>,
) -> Result<(), String> {
    let registry = app.state::<MenuItemRegistry<R>>();
    for update in updates {
        registry
            .set_accelerator(&update.id, update.accelerator.as_deref())
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

/// 更新菜单文本的命令
#[tauri::command]
pub fn update_menu_texts<R: Runtime>(
    app: tauri::AppHandle<R>,
    texts: MenuTexts,
) -> Result<(), String> {
    // 重新构建菜单
    let menu = build_menu_with_texts(&app, &texts).map_err(|e| e.to_string())?;
    // 将新菜单应用到应用窗口
    app.set_menu(menu).map_err(|e| e.to_string())?;
    Ok(())
}

/// 带文本参数的菜单构建函数
pub(crate) fn build_menu_with_texts<R: tauri::Runtime>(
    handle: &tauri::AppHandle<R>,
    texts: &MenuTexts,
) -> tauri::Result<Menu<R>> {
    let registry = handle.state::<MenuItemRegistry<R>>();
    let app_name = &texts.app_name;
    let about_item =
        MenuItemBuilder::with_id("about", texts.about.clone()).build(handle)?;
    let check_updates_item =
        MenuItemBuilder::with_id("check_for_updates", texts.check_updates.clone()).build(handle)?;
    let settings_item = MenuItemBuilder::with_id("file_open_settings", texts.settings.clone())
        .accelerator("CmdOrCtrl+,")
        .build(handle)?;
    let app_menu = Submenu::with_items(
        handle,
        app_name.clone(),
        true,
        &[
            &about_item,
            &check_updates_item,
            &settings_item,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::services(handle, Some(&texts.services))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::hide(handle, Some(&texts.hide))?,
            &PredefinedMenuItem::hide_others(handle, Some(&texts.hide_others))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::quit(handle, Some(&texts.quit))?,
        ],
    )?;

    let new_agent_item = MenuItemBuilder::with_id("file_new_agent", texts.new_agent.clone()).build(handle)?;
    let new_worktree_agent_item =
        MenuItemBuilder::with_id("file_new_worktree_agent", texts.new_worktree_agent.clone()).build(handle)?;
    let new_clone_agent_item =
        MenuItemBuilder::with_id("file_new_clone_agent", texts.new_clone_agent.clone()).build(handle)?;
    let add_workspace_item =
        MenuItemBuilder::with_id("file_add_workspace", texts.add_workspaces.clone()).build(handle)?;

    registry.register("file_new_agent", &new_agent_item);
    registry.register("file_new_worktree_agent", &new_worktree_agent_item);
    registry.register("file_new_clone_agent", &new_clone_agent_item);

    #[cfg(target_os = "linux")]
    let file_menu = {
        let close_window_item =
            MenuItemBuilder::with_id("file_close_window", texts.close_window.clone()).build(handle)?;
        let quit_item = MenuItemBuilder::with_id("file_quit", texts.quit.clone()).build(handle)?;
        Submenu::with_items(
            handle,
            texts.file.clone(),
            true,
            &[
                &new_agent_item,
                &new_worktree_agent_item,
                &new_clone_agent_item,
                &PredefinedMenuItem::separator(handle)?,
                &add_workspace_item,
                &PredefinedMenuItem::separator(handle)?,
                &close_window_item,
                &quit_item,
            ],
        )?
    };
    #[cfg(not(target_os = "linux"))]
    let file_menu = Submenu::with_items(
        handle,
        texts.file.clone(),
        true,
        &[
            &new_agent_item,
            &new_worktree_agent_item,
            &new_clone_agent_item,
            &PredefinedMenuItem::separator(handle)?,
            &add_workspace_item,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::close_window(handle, Some(&texts.close_window))?,
            #[cfg(not(target_os = "macos"))]
            &PredefinedMenuItem::quit(handle, Some(&texts.quit))?,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        handle,
        texts.edit.clone(),
        true,
        &[
            &PredefinedMenuItem::undo(handle, Some(&texts.undo))?,
            &PredefinedMenuItem::redo(handle, Some(&texts.redo))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::cut(handle, Some(&texts.cut))?,
            &PredefinedMenuItem::copy(handle, Some(&texts.copy))?,
            &PredefinedMenuItem::paste(handle, Some(&texts.paste))?,
            &PredefinedMenuItem::select_all(handle, Some(&texts.select_all))?,
        ],
    )?;

    let cycle_model_item = MenuItemBuilder::with_id("composer_cycle_model", texts.cycle_model.clone())
        .accelerator("CmdOrCtrl+Shift+M")
        .build(handle)?;
    let cycle_access_item = MenuItemBuilder::with_id("composer_cycle_access", texts.cycle_access_mode.clone())
        .accelerator("CmdOrCtrl+Shift+A")
        .build(handle)?;
    let cycle_reasoning_item =
        MenuItemBuilder::with_id("composer_cycle_reasoning", texts.cycle_reasoning_mode.clone())
            .accelerator("CmdOrCtrl+Shift+R")
            .build(handle)?;
    let cycle_collaboration_item =
        MenuItemBuilder::with_id("composer_cycle_collaboration", texts.cycle_collaboration_mode.clone())
            .accelerator("Shift+Tab")
            .build(handle)?;
    registry.register("composer_cycle_model", &cycle_model_item);
    registry.register("composer_cycle_access", &cycle_access_item);
    registry.register("composer_cycle_reasoning", &cycle_reasoning_item);
    registry.register("composer_cycle_collaboration", &cycle_collaboration_item);

    let composer_menu = Submenu::with_items(
        handle,
        texts.composer.clone(),
        true,
        &[
            &cycle_model_item,
            &cycle_access_item,
            &cycle_reasoning_item,
            &cycle_collaboration_item,
        ],
    )?;

    let toggle_projects_sidebar_item =
        MenuItemBuilder::with_id("view_toggle_projects_sidebar", texts.toggle_projects_sidebar.clone())
            .build(handle)?;
    let toggle_git_sidebar_item =
        MenuItemBuilder::with_id("view_toggle_git_sidebar", texts.toggle_git_sidebar.clone()).build(handle)?;
    let toggle_debug_panel_item =
        MenuItemBuilder::with_id("view_toggle_debug_panel", texts.toggle_debug_panel.clone())
            .accelerator("CmdOrCtrl+Shift+D")
            .build(handle)?;
    let toggle_terminal_item = MenuItemBuilder::with_id("view_toggle_terminal", texts.toggle_terminal.clone())
        .accelerator("CmdOrCtrl+Shift+T")
        .build(handle)?;
    let next_agent_item =
        MenuItemBuilder::with_id("view_next_agent", texts.next_agent.clone()).build(handle)?;
    let prev_agent_item =
        MenuItemBuilder::with_id("view_prev_agent", texts.previous_agent.clone()).build(handle)?;
    let next_workspace_item =
        MenuItemBuilder::with_id("view_next_workspace", texts.next_workspace.clone()).build(handle)?;
    let prev_workspace_item =
        MenuItemBuilder::with_id("view_prev_workspace", texts.previous_workspace.clone()).build(handle)?;
    registry.register(
        "view_toggle_projects_sidebar",
        &toggle_projects_sidebar_item,
    );
    registry.register("view_toggle_git_sidebar", &toggle_git_sidebar_item);
    registry.register("view_toggle_debug_panel", &toggle_debug_panel_item);
    registry.register("view_toggle_terminal", &toggle_terminal_item);
    registry.register("view_next_agent", &next_agent_item);
    registry.register("view_prev_agent", &prev_agent_item);
    registry.register("view_next_workspace", &next_workspace_item);
    registry.register("view_prev_workspace", &prev_workspace_item);

    #[cfg(target_os = "linux")]
    let view_menu = {
        let fullscreen_item =
            MenuItemBuilder::with_id("view_fullscreen", texts.toggle_full_screen.clone()).build(handle)?;
        Submenu::with_items(
            handle,
            texts.view.clone(),
            true,
            &[
                &toggle_projects_sidebar_item,
                &toggle_git_sidebar_item,
                &PredefinedMenuItem::separator(handle)?,
                &toggle_debug_panel_item,
                &toggle_terminal_item,
                &PredefinedMenuItem::separator(handle)?,
                &next_agent_item,
                &prev_agent_item,
                &next_workspace_item,
                &prev_workspace_item,
                &PredefinedMenuItem::separator(handle)?,
                &fullscreen_item,
            ],
        )?
    };
    #[cfg(not(target_os = "linux"))]
    let view_menu = Submenu::with_items(
        handle,
        texts.view.clone(),
        true,
        &[
            &toggle_projects_sidebar_item,
            &toggle_git_sidebar_item,
            &PredefinedMenuItem::separator(handle)?,
            &toggle_debug_panel_item,
            &toggle_terminal_item,
            &PredefinedMenuItem::separator(handle)?,
            &next_agent_item,
            &prev_agent_item,
            &next_workspace_item,
            &prev_workspace_item,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::fullscreen(handle, Some(&texts.toggle_full_screen))?,
        ],
    )?;

    #[cfg(target_os = "linux")]
    let window_menu = {
        let minimize_item =
            MenuItemBuilder::with_id("window_minimize", texts.minimize.clone()).build(handle)?;
        let maximize_item =
            MenuItemBuilder::with_id("window_maximize", texts.maximize.clone()).build(handle)?;
        let close_item = MenuItemBuilder::with_id("window_close", texts.close_window.clone()).build(handle)?;
        Submenu::with_items(
            handle,
            texts.window.clone(),
            true,
            &[
                &minimize_item,
                &maximize_item,
                &PredefinedMenuItem::separator(handle)?,
                &close_item,
            ],
        )?
    };
    #[cfg(not(target_os = "linux"))]
    let window_menu = Submenu::with_items(
        handle,
        texts.window.clone(),
        true,
        &[
            &PredefinedMenuItem::minimize(handle, Some(&texts.minimize))?,
            &PredefinedMenuItem::maximize(handle, Some(&texts.maximize))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::close_window(handle, Some(&texts.close_window))?,
        ],
    )?;

    #[cfg(target_os = "linux")]
    let help_menu = {
        let about_item =
            MenuItemBuilder::with_id("help_about", texts.about.clone()).build(handle)?;
        Submenu::with_items(handle, texts.help.clone(), true, &[&about_item])?
    };
    #[cfg(not(target_os = "linux"))]
    let help_menu = Submenu::with_items(handle, texts.help.clone(), true, &[])?;

    Menu::with_items(
        handle,
        &[
            &app_menu,
            &file_menu,
            &edit_menu,
            &composer_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ],
    )
}

pub(crate) fn build_menu<R: tauri::Runtime>(
    handle: &tauri::AppHandle<R>,
) -> tauri::Result<Menu<R>> {
    // 使用默认文本构建菜单
    let texts = MenuTexts::default();
    build_menu_with_texts(handle, &texts)
}

pub(crate) fn handle_menu_event<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    event: tauri::menu::MenuEvent,
) {
    match event.id().as_ref() {
        "about" | "help_about" => {
            if let Some(window) = app.get_webview_window("about") {
                let _ = window.show();
                let _ = window.set_focus();
                return;
            }
            let _ = WebviewWindowBuilder::new(app, "about", WebviewUrl::App("index.html".into()))
                .title("About Codex Monitor")
                .resizable(false)
                .inner_size(360.0, 240.0)
                .center()
                .build();
        }
        "check_for_updates" => {
            let _ = app.emit("updater-check", ());
        }
        "file_new_agent" => emit_menu_event(app, "menu-new-agent"),
        "file_new_worktree_agent" => emit_menu_event(app, "menu-new-worktree-agent"),
        "file_new_clone_agent" => emit_menu_event(app, "menu-new-clone-agent"),
        "file_add_workspace" => emit_menu_event(app, "menu-add-workspace"),
        "file_open_settings" => emit_menu_event(app, "menu-open-settings"),
        "file_close_window" | "window_close" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.close();
            }
        }
        "file_quit" => {
            app.exit(0);
        }
        "view_fullscreen" => {
            if let Some(window) = app.get_webview_window("main") {
                let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                let _ = window.set_fullscreen(!is_fullscreen);
            }
        }
        "view_toggle_projects_sidebar" => emit_menu_event(app, "menu-toggle-projects-sidebar"),
        "view_toggle_git_sidebar" => emit_menu_event(app, "menu-toggle-git-sidebar"),
        "view_toggle_debug_panel" => emit_menu_event(app, "menu-toggle-debug-panel"),
        "view_toggle_terminal" => emit_menu_event(app, "menu-toggle-terminal"),
        "view_next_agent" => emit_menu_event(app, "menu-next-agent"),
        "view_prev_agent" => emit_menu_event(app, "menu-prev-agent"),
        "view_next_workspace" => emit_menu_event(app, "menu-next-workspace"),
        "view_prev_workspace" => emit_menu_event(app, "menu-prev-workspace"),
        "composer_cycle_model" => emit_menu_event(app, "menu-composer-cycle-model"),
        "composer_cycle_access" => emit_menu_event(app, "menu-composer-cycle-access"),
        "composer_cycle_reasoning" => emit_menu_event(app, "menu-composer-cycle-reasoning"),
        "composer_cycle_collaboration" => emit_menu_event(app, "menu-composer-cycle-collaboration"),
        "window_minimize" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.minimize();
            }
        }
        "window_maximize" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
            }
        }
        _ => {}
    }
}

fn emit_menu_event<R: tauri::Runtime>(app: &tauri::AppHandle<R>, event: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit(event, ());
    } else {
        let _ = app.emit(event, ());
    }
}