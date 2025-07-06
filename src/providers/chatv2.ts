import * as vscode from 'vscode';
import { getChatHtmlForWebview } from '../webviews/chat';
import { createOllama } from 'ollama-ai-provider';
import { streamText } from 'ai';

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    public static readonly viewType = 'simpleChatExtension.chat';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            ChatPanel.viewType,
            'Simple Chat',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (data) => {
                console.log('Received message from webview:', data);
                switch (data.type) {
                    case 'sendMessage':
                        await this.handleUserMessage(data.message);
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }

    private async handleUserMessage(message: string) {
        if (!this._panel) {
            return;
        }

        // Add user message to chat
        this._panel.webview.postMessage({
            type: 'addMessage',
            message: {
                id: Date.now().toString(),
                text: message,
                isUser: true,
                timestamp: new Date().toLocaleTimeString()
            }
        });

        // Create assistant message placeholder
        const assistantMessageId = (Date.now() + 1).toString();
        this._panel.webview.postMessage({
            type: 'addMessage',
            message: {
                id: assistantMessageId,
                text: '',
                isUser: false,
                timestamp: new Date().toLocaleTimeString(),
                isStreaming: true
            }
        });

        try {
            const ollama = createOllama({
                baseURL: 'http://localhost:11434/api',
            });
            const result = streamText({
                model: ollama("llama3.2"),
                prompt: message,
            });

            let fullText = '';
            for await (const textPart of result.textStream) {
                fullText += textPart;

                // Update the message with streaming text
                this._panel.webview.postMessage({
                    type: 'updateMessage',
                    messageId: assistantMessageId,
                    text: fullText
                });
            }

            // Mark streaming as complete
            this._panel.webview.postMessage({
                type: 'completeMessage',
                messageId: assistantMessageId
            });

        } catch (error) {
            console.error('Chat error:', error);
            // Handle error
            this._panel.webview.postMessage({
                type: 'updateMessage',
                messageId: assistantMessageId,
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                isError: true
            });

            this._panel.webview.postMessage({
                type: 'completeMessage',
                messageId: assistantMessageId
            });
        }
    }

    public dispose() {
        ChatPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = getChatHtmlForWebview(webview);
    }
}