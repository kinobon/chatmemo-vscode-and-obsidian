import React, { useState } from 'react';
import { css } from 'styled-system/css';
import { ChatMessage } from './types';
import { linkify } from './linkify';

interface Props {
  message: ChatMessage;
  replyTo?: ChatMessage;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenThread: () => void;
  isActive?: boolean;
  compact?: boolean;
}

export function MessageBubble({ message, replyTo, onReply, onEdit, onDelete, onOpenThread, isActive, compact }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={css({
        position: 'relative',
        padding: compact ? '8px 14px' : '10px 14px',
        borderRadius: '12px',
        bg: isActive
          ? 'var(--vscode-list-activeSelectionBackground)'
          : 'color-mix(in srgb, var(--vscode-editor-foreground) 6%, transparent)',
        _hover: {
          bg: isActive
            ? 'var(--vscode-list-activeSelectionBackground)'
            : 'color-mix(in srgb, var(--vscode-editor-foreground) 10%, transparent)',
        },
        transition: 'background 0.15s',
        maxWidth: '85%',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        })}>
          {replyTo.message}
        </div>
      )}
      <div
        className={css({
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.5',
        })}
        dangerouslySetInnerHTML={{ __html: linkify(message.message) }}
      />

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
          <ActionButton label="💬" title="スレッド" onClick={onOpenThread} />
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
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '16px',
        color: 'var(--vscode-editor-foreground)',
        _hover: { bg: 'var(--vscode-toolbar-hoverBackground)' },
      })}
    >
      {label}
    </button>
  );
}
