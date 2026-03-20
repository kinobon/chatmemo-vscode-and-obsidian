import * as vscode from 'vscode';
import { ChatMemoEditorProvider } from './editorProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(ChatMemoEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand('chatmemo.openAsText', async (uri?: vscode.Uri) => {
      const target = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (target) {
        const doc = await vscode.workspace.openTextDocument(target);
        await vscode.languages.setTextDocumentLanguage(doc, 'markdown');
        await vscode.window.showTextDocument(doc, { preview: false });
      }
    })
  );
}

export function deactivate() {}
