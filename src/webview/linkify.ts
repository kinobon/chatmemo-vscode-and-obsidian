const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function linkify(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(URL_REGEX, (url) => {
    return `<a href="${url}" style="color: var(--vscode-textLink-foreground); text-decoration: underline;" title="${url}">${url}</a>`;
  });
}
