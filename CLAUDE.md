# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

ChatMemo is a VS Code extension that provides a Slack-like chat UI for taking notes. Files use the `.chatmd` extension and contain messages in a Markdown-based format with HTML comment headers (`<!-- msg:ID re:PARENT -->`) for threading.

## Build & Development

```bash
pnpm install          # install dependencies
pnpm build            # full build: Panda CSS codegen → esbuild (extension + webview)
pnpm watch            # tsc watch mode (type-checking only, not a full build)
pnpm package          # build + package into .vsix
```

There are no tests or linting configured.

To test the extension: open this repo in VS Code, press F5 to launch the Extension Development Host, then open a `.chatmd` file.

## Build Pipeline (build.mjs)

The build has 4 steps run sequentially:
1. `panda codegen` — generates the `styled-system/` directory from `panda.config.ts`
2. `panda cssgen` — outputs `out/panda.css`
3. esbuild bundles `src/extension/index.ts` → `out/extension.js` (CJS, Node, externals: `vscode`)
4. esbuild bundles `src/webview/index.tsx` → `out/webview.js` (IIFE, browser, CSS imports stubbed)
5. Copies `out/panda.css` → `out/webview.css`

## Architecture

Two separate bundles communicate via VS Code's `postMessage` API:

- **Extension host** (`src/extension/`): `ChatMemoEditorProvider` implements `CustomTextEditorProvider`. It owns the document, parses Markdown-format messages via `format.ts`, and handles add/edit/delete messages from the webview. Changes are applied as `WorkspaceEdit`s so VS Code manages undo/redo and dirty state. `format.ts` contains the parser, serializer, ID generator, and JSON migration logic.

- **Webview** (`src/webview/`): React 19 app rendered in a VS Code webview panel. Components: `App` (state management, message routing), `MessageBubble` (individual message with hover actions), `ThreadView` (side panel for threaded replies), `Composer` (input area with reply/edit modes). Styling uses Panda CSS with `styled-system/css`.

The `ChatMessage` type is defined in `src/extension/format.ts` (canonical) and `src/webview/types.ts` (identical interface: `{id, parent?, message}`). Keep them in sync.

## Key Conventions

- Package manager: **pnpm** (v10)
- Path alias: `styled-system/*` maps to `./styled-system/*` (configured in both tsconfig.json and build.mjs)
- The webview uses VS Code CSS variables (e.g., `var(--vscode-editor-background)`) for theming
- UI text is in Japanese
