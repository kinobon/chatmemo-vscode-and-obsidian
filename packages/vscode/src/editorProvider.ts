import * as vscode from 'vscode';
import { ChatMessage, parseMessages, serializeMessages, nextId, migrateFromJson } from '@chatmemo/core';

export class ChatMemoEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      'chatmemo.editor',
      new ChatMemoEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };

    const scriptUri = webviewPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js')
    );
    const cssUri = webviewPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.css')
    );

    webviewPanel.webview.html = this.getHtml(webviewPanel.webview, scriptUri, cssUri);

    const updateWebview = () => {
      const messages = this.getMessages(document);
      webviewPanel.webview.postMessage({ type: 'update', messages });
    };

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    const postMessages = (messages: ChatMessage[]) => {
      webviewPanel.webview.postMessage({ type: 'update', messages });
    };

    webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'add': {
          const messages = this.getMessages(document);
          const id = nextId(messages);
          const entry: ChatMessage = { id, message: msg.message, timestamp: new Date().toISOString() };
          if (msg.by) entry.by = msg.by;
          if (msg.parent) entry.parent = msg.parent;
          messages.push(entry);
          await this.writeMessages(document, messages);
          postMessages(messages);
          break;
        }
        case 'edit': {
          const messages = this.getMessages(document);
          const target = messages.find(m => m.id === msg.id);
          if (target) {
            target.message = msg.message;
            await this.writeMessages(document, messages);
            postMessages(messages);
          }
          break;
        }
        case 'delete': {
          const messages = this.getMessages(document);
          const target = messages.find(m => m.id === msg.id);
          if (target) {
            target.message = '';
            await this.writeMessages(document, messages);
            postMessages(messages);
          }
          break;
        }
        case 'ready':
          updateWebview();
          break;
      }
    });
  }

  private getMessages(document: vscode.TextDocument): ChatMessage[] {
    const text = document.getText();
    if (!text.trim()) return [];
    const migrated = migrateFromJson(text);
    if (migrated) return migrated;
    return parseMessages(text);
  }

  private async writeMessages(document: vscode.TextDocument, messages: ChatMessage[]): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(
      document.uri,
      fullRange,
      serializeMessages(messages)
    );
    await vscode.workspace.applyEdit(edit);
  }

  private getHtml(webview: vscode.Webview, scriptUri: vscode.Uri, cssUri: vscode.Uri): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${cssUri}" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
