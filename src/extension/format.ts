export interface ChatMessage {
  id: string;
  parent?: string;
  message: string;
}

const HEADER_RE = /^<!-- msg:(\d+)(?:\s+re:(\d+))? -->$/;
const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/;

const FRONTMATTER = `---
description: |
  Markdown形式のSlack風チャットメモ。
  各メッセージはHTMLコメント <!-- msg:ID --> で区切られる。
  <!-- msg:ID re:PARENT_ID --> はスレッド返信を示す。
  IDはファイル内で一意な連番整数。本文はヘッダー行の次の行から次のヘッダーまで。
  メッセージ本文にはMarkdown記法が使える。
  本文が空のメッセージは削除済みを意味する。
---`;

function stripFrontmatter(text: string): string {
  return text.replace(FRONTMATTER_RE, '');
}

export function parseMessages(text: string): ChatMessage[] {
  const lines = stripFrontmatter(text).split('\n');
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;
  let bodyLines: string[] = [];

  const flush = () => {
    if (current) {
      current.message = bodyLines.join('\n').trim();
      messages.push(current);
    }
  };

  for (const line of lines) {
    const match = line.match(HEADER_RE);
    if (match) {
      flush();
      current = { id: match[1], message: '' };
      if (match[2]) current.parent = match[2];
      bodyLines = [];
    } else if (current) {
      bodyLines.push(line);
    }
  }
  flush();

  return messages;
}

export function serializeMessages(messages: ChatMessage[]): string {
  const body = messages.map(m => {
    const header = m.parent
      ? `<!-- msg:${m.id} re:${m.parent} -->`
      : `<!-- msg:${m.id} -->`;
    return `${header}\n${m.message}`;
  }).join('\n\n');
  return `${FRONTMATTER}\n\n${body}`;
}

export function nextId(messages: ChatMessage[]): string {
  let max = 0;
  for (const m of messages) {
    const n = parseInt(m.id, 10);
    if (n > max) max = n;
  }
  return String(max + 1);
}

export function migrateFromJson(text: string): ChatMessage[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[')) return null;

  try {
    const arr = JSON.parse(trimmed) as Array<{ id: string; parent?: string; message: string }>;
    if (!Array.isArray(arr)) return null;

    // Build UUID → sequential ID mapping
    const idMap = new Map<string, string>();
    arr.forEach((m, i) => {
      idMap.set(m.id, String(i + 1));
    });

    return arr.map(m => {
      const msg: ChatMessage = {
        id: idMap.get(m.id)!,
        message: m.message,
      };
      if (m.parent && idMap.has(m.parent)) {
        msg.parent = idMap.get(m.parent)!;
      }
      return msg;
    });
  } catch {
    return null;
  }
}
