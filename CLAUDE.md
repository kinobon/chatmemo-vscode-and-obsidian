# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

ChatMemo is a Slack-like chat UI for taking notes, structured as a monorepo with shared core/UI packages and platform-specific host packages. Files use the `.chat.md` extension and contain messages in a Markdown-based format with HTML comment headers (`<!-- msg:ID by:AUTHOR re:PARENT ts:TIMESTAMP -->`) for threading.

## Monorepo Structure

```
packages/
  core/       ← Parser/serializer, ChatMessage type (pure TypeScript, no deps)
  ui/         ← React 19 components + Panda CSS (platform-agnostic)
  vscode/     ← VS Code extension host layer
  obsidian/   ← (planned) Obsidian plugin host layer
```

## Build & Development

```bash
pnpm install          # install dependencies
pnpm build            # build VS Code extension (Panda CSS → esbuild)
pnpm package          # build + package into .vsix
```

There are no tests or linting configured.

To test the extension: open this repo in VS Code, press F5 to launch the Extension Development Host, then open a `.chat.md` file.

## Build Pipeline (packages/vscode/build.mjs)

1. `panda codegen` — generates `packages/ui/styled-system/` from `packages/ui/panda.config.ts`
2. `panda cssgen` — outputs `packages/ui/out/panda.css`
3. esbuild bundles `packages/vscode/src/index.ts` → `out/extension.js` (CJS, Node, externals: `vscode`)
4. esbuild bundles `packages/vscode/src/webview.tsx` → `out/webview.js` (IIFE, browser, CSS imports stubbed)
5. Assembles `out/webview.css` from theme-vscode.css + panda.css + theme.css + markdown.css

## Architecture

### packages/core
Pure TypeScript parser/serializer with zero dependencies. Exports `parseMessages`, `serializeMessages`, `nextId`, `migrateFromJson`, and the `ChatMessage` type.

### packages/ui
React 19 components with a `HostAdapter` interface that abstracts platform communication:
- `App` — main container, accepts `HostAdapter` prop
- `MessageBubble` — individual message with hover actions
- `ThreadView` — side panel for threaded replies
- `Composer` — input area with reply/edit modes

**HostAdapter** (`packages/ui/src/host.ts`): interface with `addMessage`, `editMessage`, `deleteMessage`, `onMessagesChanged`, `copyToClipboard`. Each platform implements this interface.

**CSS theming**: Components use `--cm-*` CSS custom properties (e.g., `var(--cm-bg)`, `var(--cm-accent)`). Each platform provides a mapping CSS file (e.g., `theme-vscode.css` maps `--cm-*` → `--vscode-*`).

### packages/vscode
VS Code extension host. `ChatMemoEditorProvider` implements `CustomTextEditorProvider`, owns the document, and bridges to the webview via `postMessage`. The webview entry point (`webview.tsx`) creates a `VscodeHostAdapter` that wraps `postMessage`.

## Key Conventions

- Package manager: **pnpm** (v10) with workspaces
- Path alias: `styled-system/*` maps to `packages/ui/styled-system/*`
- `@chatmemo/core` and `@chatmemo/ui` are workspace packages resolved via `workspace:*`
- UI text is in Japanese
