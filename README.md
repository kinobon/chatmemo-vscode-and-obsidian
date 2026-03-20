# ChatMemo

Slack風のチャットUIでメモが取れるVS Code拡張機能。

## 特徴

- **チャット形式のメモ** — メッセージを送信する感覚でメモを残せる
- **スレッド/返信** — メッセージに返信してチェーンを作成、サイドパネルでスレッド表示
- **編集・削除** — 既存メッセージの編集、削除に対応
- **リンク認識** — URL を自動でクリック可能なリンクに変換
- **専用ファイル形式** — `.chatmemo` 拡張子、1ファイル = 1ルーム
- **データはJSON** — 内部はフラットなJSON配列。Git管理やスクリプト処理が容易

## データ構造

```json
[
  { "id": "uuid-1", "message": "最初のメッセージ" },
  { "id": "uuid-2", "parent": "uuid-1", "message": "これは返信" }
]
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | string | メッセージの一意識別子 (UUID) |
| `parent` | string? | 返信先メッセージのID（省略時はルートメッセージ） |
| `message` | string | メッセージ本文 |

## インストール

```bash
# リポジトリをクローンしてビルド
git clone https://github.com/kinobon/chatmemo-vscode.git
cd chatmemo-vscode
pnpm install
pnpm build

# vsixをパッケージング & インストール
pnpm package
code --install-extension chatmemo-0.1.0.vsix
```

## 使い方

1. `.chatmemo` ファイルを作成して VS Code で開く
2. 下部のテキストエリアにメッセージを入力
3. **Enter** で送信、**Shift+Enter** で改行
4. メッセージにホバーすると操作ボタンが表示される
   - ↩ 返信 / ✎ 編集 / 🗑 削除 / 💬 スレッド表示

## 技術スタック

- **Extension host**: TypeScript + esbuild
- **Webview**: React 19 + Panda CSS
- **Editor**: VS Code Custom Text Editor API

## 開発

```bash
pnpm install
pnpm build    # ビルド（Panda CSS codegen + esbuild）
```
