import { TextFileView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { App } from '@chatmemo/ui';
import type { HostAdapter } from '@chatmemo/ui';
import { parseMessages, serializeMessages, nextId } from '@chatmemo/core';
import type { ChatMessage } from '@chatmemo/core';

export const VIEW_TYPE_CHATMEMO = 'chatmemo-view';

export class ChatMemoView extends TextFileView {
  private root: Root | null = null;
  private messagesCallback: ((messages: ChatMessage[]) => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_CHATMEMO;
  }

  getDisplayText(): string {
    return this.file?.basename ?? 'ChatMemo';
  }

  setViewData(data: string, clear: boolean): void {
    this.data = data;
    const messages = data.trim() ? parseMessages(data) : [];
    this.messagesCallback?.(messages);
  }

  getViewData(): string {
    return this.data;
  }

  clear(): void {
    this.data = '';
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass('chatmemo-container');

    const host = this.createHostAdapter();
    this.root = createRoot(container);
    this.root.render(<App host={host} />);
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
    this.messagesCallback = null;
  }

  private createHostAdapter(): HostAdapter {
    return {
      addMessage: (message: string, parent?: string, by?: string) => {
        const messages = this.data.trim() ? parseMessages(this.data) : [];
        const id = nextId(messages);
        const entry: ChatMessage = { id, message, timestamp: new Date().toISOString() };
        if (by) entry.by = by;
        if (parent) entry.parent = parent;
        messages.push(entry);
        this.data = serializeMessages(messages);
        this.requestSave();
        this.messagesCallback?.(messages);
      },
      editMessage: (id: string, message: string) => {
        const messages = parseMessages(this.data);
        const target = messages.find(m => m.id === id);
        if (target) {
          target.message = message;
          this.data = serializeMessages(messages);
          this.requestSave();
          this.messagesCallback?.(messages);
        }
      },
      deleteMessage: (id: string) => {
        const messages = parseMessages(this.data);
        const target = messages.find(m => m.id === id);
        if (target) {
          target.message = '';
          this.data = serializeMessages(messages);
          this.requestSave();
          this.messagesCallback?.(messages);
        }
      },
      onMessagesChanged: (cb: (messages: ChatMessage[]) => void) => {
        this.messagesCallback = cb;
        if (this.data.trim()) {
          cb(parseMessages(this.data));
        }
        return () => { this.messagesCallback = null; };
      },
      copyToClipboard: async (text: string) => {
        await navigator.clipboard.writeText(text);
      },
    };
  }
}
