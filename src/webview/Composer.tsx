import React, { useState, useRef, useEffect } from 'react';
import { css } from 'styled-system/css';
import { ChatMessage } from './types';

interface Props {
  onSend: (text: string) => void;
  replyTo: ChatMessage | null | undefined;
  editing: ChatMessage | null | undefined;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

export function Composer({ onSend, replyTo, editing, onCancelReply, onCancelEdit }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      setText(editing.message);
      textareaRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if (editing) onCancelEdit();
      if (replyTo) onCancelReply();
    }
    // Ctrl+Z/Y がVSCodeのドキュメントundoに伝播するのを防止
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.stopPropagation();
    }
  };

  return (
    <div className={css({
      borderTop: '1px solid var(--vscode-widget-border)',
      padding: '12px 16px',
    })}>
      {replyTo && (
        <div className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          marginBottom: '8px',
          borderLeft: '3px solid var(--vscode-textLink-foreground)',
          fontSize: '12px',
          opacity: 0.8,
        })}>
          <span className={css({ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
            返信: {replyTo.message}
          </span>
          <button
            onClick={onCancelReply}
            className={css({
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--vscode-editor-foreground)',
              padding: '0 4px',
            })}
          >✕</button>
        </div>
      )}
      {editing && (
        <div className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          marginBottom: '8px',
          borderLeft: '3px solid var(--vscode-inputValidation-warningBorder)',
          fontSize: '12px',
          opacity: 0.8,
        })}>
          <span>編集中</span>
          <button
            onClick={() => { onCancelEdit(); setText(''); }}
            className={css({
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--vscode-editor-foreground)',
              padding: '0 4px',
            })}
          >✕</button>
        </div>
      )}
      <div className={css({ display: 'flex', gap: '8px' })}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Enter で送信, Shift+Enter で改行)"
          rows={1}
          className={css({
            flex: 1,
            resize: 'none',
            bg: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '4px',
            padding: '8px 12px',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: '1.4',
            outline: 'none',
            _focus: { borderColor: 'var(--vscode-focusBorder)' },
          })}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 150) + 'px';
          }}
        />
        <button
          onClick={handleSubmit}
          className={css({
            bg: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            alignSelf: 'flex-end',
            _hover: { bg: 'var(--vscode-button-hoverBackground)' },
          })}
        >
          {editing ? '更新' : '送信'}
        </button>
      </div>
    </div>
  );
}
