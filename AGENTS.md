# CodexMonitor Agent Guide

All docs must be canonical, with no past commentary, only live state.

## Scope

This file is the agent contract for how to work in this repo.
Detailed navigation/runbooks live in:

- `docs/codebase-map.md` (task-oriented file map: "if you need X, edit Y")
- `README.md` (setup, build, release, and broader project docs)

## Project Snapshot

CodexMonitor is a Tauri app that orchestrates Codex agents across local workspaces.

- Frontend: React + Vite (`src/`)
- Backend app: Tauri Rust process (`src-tauri/src/lib.rs`)
- Backend daemon: JSON-RPC process (`src-tauri/src/bin/codex_monitor_daemon.rs`)
- Shared backend source of truth: `src-tauri/src/shared/*`

## Non-Negotiable Architecture Rules

1. Put shared/domain backend logic in `src-tauri/src/shared/*` first.
2. Keep app and daemon as thin adapters around shared cores.
3. Do not duplicate logic between app and daemon.
4. Keep JSON-RPC method names and payload shapes stable unless intentionally changing contracts.
5. Keep frontend IPC contracts in sync with backend command surfaces.

## Backend Routing Rules

For backend behavior changes, follow this order:

1. Shared core (`src-tauri/src/shared/*`) when behavior is cross-runtime.
2. App adapter and Tauri command surface (`src-tauri/src/lib.rs` + adapter module).
3. Frontend IPC wrapper (`src/services/tauri.ts`).
4. Daemon RPC surface (`src-tauri/src/bin/codex_monitor_daemon/rpc.rs` + `rpc/*`).

If you add a backend command, update all relevant layers and tests.

## Backend Module Structure

Key backend modules under `src-tauri/src/`:

- `backend/` - App-server session management and event definitions
  - `app_server.rs` - Codex app-server session lifecycle
  - `events.rs` - Event types and EventSink trait
- `codex/` - Codex agent integration adapters (args, config, home)
- `workspaces/` - Workspace/worktree management adapters
- `git/` - Git operations adapters
- `settings/` - App settings adapters
- `prompts.rs` - Custom prompts adapters
- `files/` - File read/write adapters (io, ops, policy)
- `dictation/` - Voice dictation module (real + stub)
- `remote_backend/` - Remote backend protocol (TCP/WebSocket/Orbit transport)
- `tailscale/` - Tailscale integration (core, daemon commands, RPC client)
- `orbit/` - Orbit connectivity module
- `shared/*` - Cross-runtime domain logic
  - `account.rs` - Account core logic
  - `codex_core.rs` / `codex_aux_core.rs` / `codex_update_core.rs` - Codex core
  - `workspaces_core.rs` + `workspaces_core/*` - Workspaces core
  - `git_ui_core.rs` + `git_ui_core/*` - Git UI core
  - `settings_core.rs`, `files_core.rs`, `prompts_core.rs` - Domain cores
  - `orbit_core.rs`, `process_core.rs`, `local_usage_core.rs` - Helper cores

Daemon RPC structure under `src-tauri/src/bin/codex_monitor_daemon/`:

- `rpc.rs` - RPC router entrypoint
- `transport.rs` - Transport layer implementation
- `rpc/*` - Domain RPC handlers (codex, daemon, git, prompts, workspace)

## Frontend Routing Rules

- Keep `src/App.tsx` as composition/wiring root.
- Move stateful orchestration into:
  - `src/features/app/hooks/*`
  - `src/features/app/bootstrap/*`
  - `src/features/app/orchestration/*`
- Keep presentational UI in feature components.
- Keep Tauri calls in `src/services/tauri.ts` only.
- Keep event subscription fanout in `src/services/events.ts`.

## Import Aliases

Use project aliases for frontend imports:

- `@/*` -> `src/*`
- `@app/*` -> `src/features/app/*`
- `@settings/*` -> `src/features/settings/*`
- `@threads/*` -> `src/features/threads/*`
- `@services/*` -> `src/services/*`
- `@utils/*` -> `src/utils/*`

## Key File Anchors

- Frontend composition root: `src/App.tsx`
- Frontend IPC wrapper: `src/services/tauri.ts`
- Frontend event hub: `src/services/events.ts`
- App command registry: `src-tauri/src/lib.rs`
- Backend event definitions: `src-tauri/src/backend/events.rs`
- Daemon entrypoint: `src-tauri/src/bin/codex_monitor_daemon.rs`
- Daemon RPC router: `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`
- Daemon RPC handlers: `src-tauri/src/bin/codex_monitor_daemon/rpc/*`
- Shared workspaces core: `src-tauri/src/shared/workspaces_core.rs` + `src-tauri/src/shared/workspaces_core/*`
- Shared git UI core: `src-tauri/src/shared/git_ui_core.rs` + `src-tauri/src/shared/git_ui_core/*`
- Threads reducer entrypoint: `src/features/threads/hooks/useThreadsReducer.ts`
- Threads reducer slices: `src/features/threads/hooks/threadReducer/*`

For broader path maps, use `docs/codebase-map.md`.

## App/Daemon Parity Checklist

When changing backend behavior that can run remotely:

1. Shared core logic updated (or explicitly app-only/daemon-only).
2. App surface updated (`src-tauri/src/lib.rs` + adapter).
3. Frontend IPC updated (`src/services/tauri.ts`) when needed.
4. Daemon RPC updated (`rpc.rs` + `rpc/*`) when needed.
5. Contract/test coverage updated.

## Design System Rule (High-Level)

Use existing design-system primitives and tokens for shared shell chrome.
Do not reintroduce duplicated modal/toast/panel/popover shell styling in feature CSS.

Codemods available for DS shell migration:

```bash
npm run codemod:modal-shell    # Migrate to modal shell
npm run codemod:panel-shell    # Migrate to panel shell
npm run codemod:toast-shell    # Migrate to toast shell
npm run codemod:ds:dry         # Dry-run all DS codemods
npm run codemod:ds             # Run all DS codemods
```

(See existing DS files and lint guardrails for implementation details.)

## Safety and Git Behavior

- Prefer safe git operations (`status`, `diff`, `log`).
- Do not reset/revert unrelated user changes.
- If unrelated changes appear, continue focusing on owned files unless they block correctness.
- If conflicts impact correctness, call them out and choose the safest path.
- Fix root cause, not band-aids.

## Validation Matrix

Run validations based on touched areas:

- Always: `npm run typecheck`
- Frontend behavior/state/hooks/components: `npm run test`
- Rust backend changes: `cd src-tauri && cargo check`
- Use targeted tests for touched modules before full-suite runs when iterating.

## Quick Runbook

Core local commands (keep these inline for daily use):

```bash
npm install
npm run doctor:win        # Windows doctor check
npm run tauri:dev         # Start dev server (macOS/Linux)
npm run tauri:dev:win     # Start dev server (Windows)
npm run test
npm run test:watch        # Test watch mode
npm run typecheck
npm run lint              # Run ESLint
npm run sync:material-icons  # Sync Material icons
cd src-tauri && cargo check
```

Release build:

```bash
npm run tauri:build        # Build for current platform
npm run tauri:build:win   # Build for Windows
npm run build:appimage     # Build AppImage (Linux)
npm run preview            # Preview build result
```

Focused test runs:

```bash
npm run test -- <path-to-test-file>
```

## Hotspots

Use extra care in high-churn/high-complexity files:

- `src/App.tsx`
- `src/features/settings/components/SettingsView.tsx`
- `src/features/threads/hooks/useThreadsReducer.ts`
- `src-tauri/src/shared/git_ui_core.rs`
- `src-tauri/src/shared/workspaces_core.rs`
- `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`

## Key Dependencies

Frontend (key packages):

- React 19 + React DOM 19
- Vite 7 + Vitest 3
- Tauri API 2.9.x
- i18next 25.x + react-i18next 16.x
- @tanstack/react-virtual (virtual lists)
- @xterm/xterm 5.x (terminal)
- lucide-react (icons)
- @sentry/react (error tracking)
- @pierre/diffs (diff rendering)
- prismjs (syntax highlighting)
- react-markdown + remark-gfm (Markdown rendering)
- tauri-plugin-liquid-glass-api (iOS liquid glass effect)

Backend (key crates):

- Tauri 2.x with plugins (updater, notification, dialog, opener, process, window-state, liquid-glass)
- Tokio (async runtime)
- git2 (Git operations)
- reqwest (HTTP client)
- serde + serde_json (serialization)
- tokio-tungstenite (WebSocket)
- uuid (UUID generation)
- ignore (gitignore parsing)
- chrono (time handling)
- toml (TOML parsing)

Backend (desktop only):

- whisper-rs (voice dictation)
- portable-pty (pseudo terminal)
- cpal (audio)
- sha2 (SHA hashing)

Backend (macOS/iOS only):

- objc2 series (Objective-C bindings)

## Canonical References

- Task-oriented code map: `docs/codebase-map.md`
- Setup/build/release/test commands: `README.md`