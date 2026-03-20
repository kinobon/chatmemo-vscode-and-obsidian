import * as vscode from 'vscode';
import { ChatMemoEditorProvider } from './editorProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(ChatMemoEditorProvider.register(context));
}

export function deactivate() {}
