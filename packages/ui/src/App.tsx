import React, { useState, useEffect, useRef, useCallback } from 'react';
import { css } from 'styled-system/css';
import type { ChatMessage } from '@chatmemo/core';
import type { HostAdapter } from './host';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { ThreadView } from './ThreadView';

interface Props {
  host: HostAdapter;
}

export function App({ host }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = host.onMessagesChanged((msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, [host]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((text: string) => {
    if (editingId) {
      host.editMessage(editingId, text);
      setEditingId(null);
    } else {
      host.addMessage(text, replyTo || undefined, 'me');
      setReplyTo(null);
    }
  }, [host, editingId, replyTo]);

  const handleDelete = useCallback((id: string) => {
    host.deleteMessage(id);
    if (threadRootId === id) setThreadRootId(null);
  }, [host, threadRootId]);

  const handleEdit = useCallback((id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg) setEditingId(id);
  }, [messages]);

  const handleCopy = useCallback(async (text: string) => {
    await host.copyToClipboard(text);
  }, [host]);

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

  return (
    <div className={css({
      display: 'flex',
      height: '100vh',
      bg: 'var(--cm-bg)',
      color: 'var(--cm-fg)',
      fontFamily: 'var(--cm-font-family)',
      fontSize: 'var(--cm-font-size)',
    })}>
      <div className={css({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      })}>
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
          {messages.map(msg => (
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
            host.addMessage(text, parentId, 'me');
          }}
        />
      )}
    </div>
  );
}
