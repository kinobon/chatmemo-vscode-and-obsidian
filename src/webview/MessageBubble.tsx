import { useState } from 'react';
import { css } from 'styled-system/css';
import { ChatMessage } from './types';
import { renderMarkdown } from './renderMarkdown';

interface Props {
  message: ChatMessage;
  replyTo?: ChatMessage;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenThread: () => void;
  onCopy: () => void;
  isActive?: boolean;
  compact?: boolean;
}

export function MessageBubble({ message, replyTo, onReply, onEdit, onDelete, onOpenThread, onCopy, isActive, compact }: Props) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDeleted = message.message === '';
  const isOthers = message.by === 'others';

  return (
    <div
      className={css({
        position: 'relative',
        padding: compact ? '8px 14px' : '10px 14px',
        borderRadius: '12px',
        bg: isActive
          ? 'var(--vscode-list-activeSelectionBackground)'
          : isOthers
            ? 'color-mix(in srgb, var(--vscode-textLink-foreground) 10%, transparent)'
            : 'color-mix(in srgb, var(--vscode-editor-foreground) 6%, transparent)',
        _hover: {
          bg: isActive
            ? 'var(--vscode-list-activeSelectionBackground)'
            : isOthers
              ? 'color-mix(in srgb, var(--vscode-textLink-foreground) 15%, transparent)'
              : 'color-mix(in srgb, var(--vscode-editor-foreground) 10%, transparent)',
        },
        transition: 'background 0.15s',
        maxWidth: '85%',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      {replyTo && (
        <div className={css({
          borderLeft: '2px solid var(--vscode-textLink-foreground)',
          paddingLeft: '8px',
          marginBottom: '4px',
          opacity: 0.7,
          fontSize: '12px',
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        })}>
          {replyTo.message || 'このメッセージは削除されました'}
        </div>
      )}
      {message.timestamp && (
        <div className={css({
          fontSize: '11px',
          opacity: 0.5,
          marginBottom: '2px',
        })}>
          {formatTimestamp(message.timestamp)}
        </div>
      )}
      {isDeleted ? (
        <div className={css({
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          opacity: 0.5,
          fontStyle: 'italic',
        })}>
          このメッセージは削除されました
        </div>
      ) : (
        <div
          className={`${css({
            wordBreak: 'break-word',
            lineHeight: '1.5',
          })} markdown-body`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.message) }}
        />
      )}

      {hovered && !isDeleted && (
        <div className={css({
          position: 'absolute',
          top: '-4px',
          right: '8px',
          display: 'flex',
          gap: '2px',
          bg: 'var(--vscode-editor-background)',
          border: '1px solid var(--vscode-widget-border)',
          borderRadius: '4px',
          padding: '2px',
          zIndex: 10,
        })}>
          <ActionButton label="↩" title="返信" onClick={onReply} />
          <ActionButton label="✎" title="編集" onClick={onEdit} />
          <ActionButton
            label={confirmDelete ? "✓" : "🗑"}
            title={confirmDelete ? "本当に削除" : "削除"}
            onClick={() => {
              if (confirmDelete) { onDelete(); setConfirmDelete(false); }
              else setConfirmDelete(true);
            }}
            danger={confirmDelete}
          />
          <ActionButton label="💬" title="スレッド" onClick={onOpenThread} />
          <ActionButton label="📋" title="コピー" onClick={onCopy} />
        </div>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ActionButton({ label, title, onClick, danger }: { label: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={css({
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '16px',
        color: danger ? 'var(--vscode-errorForeground)' : 'var(--vscode-editor-foreground)',
        _hover: { bg: 'var(--vscode-toolbar-hoverBackground)' },
      })}
    >
      {label}
    </button>
  );
}
