import type { ChatMessage } from '@chatmemo/core';

export interface HostAdapter {
  addMessage(message: string, parent?: string, by?: string): void;
  editMessage(id: string, message: string): void;
  deleteMessage(id: string): void;
  onMessagesChanged(callback: (messages: ChatMessage[]) => void): () => void;
  copyToClipboard(text: string): Promise<void>;
}
