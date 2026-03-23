import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@chatmemo/ui';
import type { HostAdapter } from '@chatmemo/ui';
import type { ChatMessage } from '@chatmemo/core';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

function createVscodeHostAdapter(): HostAdapter {
  let callback: ((messages: ChatMessage[]) => void) | null = null;

  window.addEventListener('message', (e: MessageEvent) => {
    const msg = e.data;
    if (msg.type === 'update' && callback) {
      callback(msg.messages);
    }
  });

  // Signal ready to extension host
  vscode.postMessage({ type: 'ready' });

  return {
    addMessage(message: string, parent?: string, by?: string) {
      vscode.postMessage({ type: 'add', message, parent, by });
    },
    editMessage(id: string, message: string) {
      vscode.postMessage({ type: 'edit', id, message });
    },
    deleteMessage(id: string) {
      vscode.postMessage({ type: 'delete', id });
    },
    onMessagesChanged(cb: (messages: ChatMessage[]) => void) {
      callback = cb;
      return () => { callback = null; };
    },
    async copyToClipboard(text: string) {
      await navigator.clipboard.writeText(text);
    },
  };
}

const host = createVscodeHostAdapter();
const root = createRoot(document.getElementById('root')!);
root.render(<App host={host} />);
