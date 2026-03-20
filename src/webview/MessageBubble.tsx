import React, { useState } from 'react';
import { css } from 'styled-system/css';
import { ChatMessage } from './types';
import { linkify } from './linkify';

interface Props {
  message: ChatMessage;
  replyCount: number;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenThread: () => void;
  isActive?: boolean;
  compact?: boolean;
}

export function MessageBubble({ message, replyCount, onReply, onEdit, onDelete, onOpenThread, isActive, compact }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={css({
        position: 'relative',
        padding: compact ? '4px 12px' : '6px 12px',
        borderRadius: '4px',
        bg: isActive ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent',
        _hover: { bg: 'var(--vscode-list-hoverBackground)' },
        transition: 'background 0.1s',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={css({
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.5',
        })}
        dangerouslySetInnerHTML={{ __html: linkify(message.message) }}
      />

      {replyCount > 0 && (
        <button
          onClick={onOpenThread}
          className={css({
            background: 'none',
            border: 'none',
            color: 'var(--vscode-textLink-foreground)',
            cursor: 'pointer',
            padding: '2px 0',
            fontSize: '12px',
            _hover: { textDecoration: 'underline' },
          })}
        >
          {replyCount}件の返信
        </button>
      )}

      {hovered && (
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
          <ActionButton label="🗑" title="削除" onClick={onDelete} />
          {replyCount > 0 && <ActionButton label="💬" title="スレッド" onClick={onOpenThread} />}
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={css({
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '13px',
        color: 'var(--vscode-editor-foreground)',
        _hover: { bg: 'var(--vscode-toolbar-hoverBackground)' },
      })}
    >
      {label}
    </button>
  );
}
