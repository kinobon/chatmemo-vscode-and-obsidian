import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,       // HTMLタグをエスケープ（XSS対策）
  breaks: true,      // 改行を<br>に変換（チャットUIに適した挙動）
  linkify: true,     // URLの自動リンク化
});

// リンクを新しいタブで開く + VS Code テーマカラー適用
const defaultRender = md.renderer.rules.link_open || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('style', 'color: var(--vscode-textLink-foreground); text-decoration: underline;');
  tokens[idx].attrSet('target', '_blank');
  return defaultRender(tokens, idx, options, env, self);
};

export function renderMarkdown(text: string): string {
  return md.render(text);
}
