import * as vscode from 'vscode';
import { ChatMemoEditorProvider } from './editorProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(ChatMemoEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand('chatmemo.openAsText', async (uri?: vscode.Uri) => {
      const target = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (target) {
        await vscode.commands.executeCommand('vscode.openWith', target, 'default');
      }
    })
  );
}

export function deactivate() {}
