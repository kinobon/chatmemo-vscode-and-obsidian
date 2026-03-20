import React, { useState, useRef, useEffect } from 'react';
import { css } from 'styled-system/css';
import { ChatMessage } from './types';
import { MessageBubble } from './MessageBubble';

interface Props {
  rootId: string;
  messages: ChatMessage[];
  onClose: () => void;
  onReply: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSendReply: (text: string, parentId: string) => void;
}

export function ThreadView({ rootId, messages, onClose, onReply, onEdit, onDelete, onSendReply }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const rootMsg = messages.find(m => m.id === rootId);

  const getThread = (parentId: string): ChatMessage[] => {
    const children = messages.filter(m => m.parent === parentId);
    const result: ChatMessage[] = [];
    for (const child of children) {
      result.push(child);
      result.push(...getThread(child.id));
    }
    return result;
  };

  const threadMessages = getThread(rootId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const lastInThread = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : rootMsg;
    onSendReply(trimmed, lastInThread?.id ?? rootId);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!rootMsg) return null;

  const getReplyCount = (id: string): number => {
    let count = 0;
    for (const m of messages) {
      if (m.parent === id) count += 1 + getReplyCount(m.id);
    }
    return count;
  };

  return (
    <div className={css({
      width: '350px',
      borderLeft: '1px solid var(--vscode-widget-border)',
      display: 'flex',
      flexDirection: 'column',
      bg: 'var(--vscode-sideBar-background)',
    })}>
      <div className={css({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--vscode-widget-border)',
        fontWeight: 'bold',
      })}>
        <span>スレッド</span>
        <button
          onClick={onClose}
          className={css({
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--vscode-editor-foreground)',
            fontSize: '16px',
            padding: '0 4px',
          })}
        >✕</button>
      </div>

      <div className={css({
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      })}>
        <MessageBubble
          message={rootMsg}
          replyCount={0}
          onReply={() => {}}
          onEdit={() => onEdit(rootMsg.id)}
          onDelete={() => onDelete(rootMsg.id)}
          onOpenThread={() => {}}
        />
        <div className={css({
          borderTop: '1px solid var(--vscode-widget-border)',
          margin: '4px 0',
          opacity: 0.5,
        })} />
        {threadMessages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            replyCount={0}
            compact
            onReply={() => {}}
            onEdit={() => onEdit(msg.id)}
            onDelete={() => onDelete(msg.id)}
            onOpenThread={() => {}}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={css({
        borderTop: '1px solid var(--vscode-widget-border)',
        padding: '8px 12px',
      })}>
        <div className={css({ display: 'flex', gap: '8px' })}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="スレッドに返信..."
            rows={1}
            className={css({
              flex: 1,
              resize: 'none',
              bg: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              border: '1px solid var(--vscode-input-border)',
              borderRadius: '4px',
              padding: '6px 10px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: '1.4',
              outline: 'none',
              _focus: { borderColor: 'var(--vscode-focusBorder)' },
            })}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSubmit}
            className={css({
              bg: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              alignSelf: 'flex-end',
              _hover: { bg: 'var(--vscode-button-hoverBackground)' },
            })}
          >
            返信
          </button>
        </div>
      </div>
    </div>
  );
}
