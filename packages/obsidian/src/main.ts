import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ChatMemoView, VIEW_TYPE_CHATMEMO } from './view';

export default class ChatMemoPlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_CHATMEMO,
      (leaf: WorkspaceLeaf) => new ChatMemoView(leaf)
    );

    this.registerExtensions(['chat'], VIEW_TYPE_CHATMEMO);
  }
}
