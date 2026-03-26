import React, { useState, useEffect, useRef, useCallback } from 'react';
import { css } from 'styled-system/css';
import { ChatMessage } from './types';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { ThreadView } from './ThreadView';

const vscode = acquireVsCodeApi();

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'update') {
        setMessages(msg.messages);
      }
    };
    window.addEventListener('message', handler);
    vscode.postMessage({ type: 'ready' });

    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(prev => {
          if (prev) {
            setSearchQuery('');
            return false;
          }
          return true;
        });
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', keyHandler);

    return () => {
      window.removeEventListener('message', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((text: string) => {
    if (editingId) {
      vscode.postMessage({ type: 'edit', id: editingId, message: text });
      setEditingId(null);
    } else {
      vscode.postMessage({ type: 'add', message: text, parent: replyTo || undefined, by: 'me' });
      setReplyTo(null);
    }
  }, [editingId, replyTo]);

  const handleDelete = useCallback((id: string) => {
    vscode.postMessage({ type: 'delete', id });
    if (threadRootId === id) setThreadRootId(null);
  }, [threadRootId]);

  const handleEdit = useCallback((id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg) setEditingId(id);
  }, [messages]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, [messages]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const findThreadRoot = useCallback((id: string): string => {
    const msg = messages.find(m => m.id === id);
    if (msg?.parent) return findThreadRoot(msg.parent);
    return id;
  }, [messages]);

  const replyToMessage = replyTo ? messages.find(m => m.id === replyTo) : null;
  const editingMessage = editingId ? messages.find(m => m.id === editingId) : null;

  const query = searchQuery.toLowerCase();
  const filteredMessages = query
    ? messages.filter(m => m.message.toLowerCase().includes(query))
    : messages;

  return (
    <div className={css({
      display: 'flex',
      height: '100vh',
      bg: 'var(--vscode-editor-background)',
      color: 'var(--vscode-editor-foreground)',
      fontFamily: 'var(--vscode-font-family)',
      fontSize: 'var(--vscode-font-size)',
    })}>
      <div className={css({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      })}>
        {searchOpen && (
          <div className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderBottom: '1px solid var(--vscode-widget-border)',
          })}>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className={css({
                flex: 1,
                bg: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                outline: 'none',
                _focus: { borderColor: 'var(--vscode-focusBorder)' },
              })}
            />
            <span className={css({ fontSize: '12px', opacity: 0.6 })}>
              {filteredMessages.length}/{messages.length}
            </span>
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
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
        <div className={css({
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        })}>
          {messages.length === 0 && (
            <div className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              opacity: 0.5,
            })}>
              メッセージを入力してください
            </div>
          )}
          {filteredMessages.map(msg => (
            <div key={msg.id} className={css({
              display: 'flex',
              justifyContent: msg.by === 'others' ? 'flex-start' : 'flex-end',
            })}>
              <MessageBubble
                message={msg}
                replyTo={msg.parent ? messages.find(m => m.id === msg.parent) : undefined}
                onReply={() => setReplyTo(msg.id)}
                onEdit={() => handleEdit(msg.id)}
                onDelete={() => handleDelete(msg.id)}
                onOpenThread={() => setThreadRootId(findThreadRoot(msg.id))}
                onCopy={() => handleCopy(msg.message)}
                isActive={threadRootId === msg.id}
              />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <Composer
          onSend={handleSend}
          replyTo={replyToMessage}
          editing={editingMessage}
          onCancelReply={handleCancelReply}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      {threadRootId && (
        <ThreadView
          rootId={threadRootId}
          messages={messages}
          onClose={() => setThreadRootId(null)}
          onReply={(id) => setReplyTo(id)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onSendReply={(text, parentId) => {
            vscode.postMessage({ type: 'add', message: text, parent: parentId, by: 'me' });
          }}
        />
      )}
    </div>
  );
}
