import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import * as vscode from 'vscode';
import { getChatHtmlForWebview } from '../webviews/chat';

export class SimpleChatProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'simpleChatExtension.webviewView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.onDidReceiveMessage(
            async (data) => {
                console.log('Received message from webview:', data);
                switch (data.type) {
                    case 'sendMessage':
                        await this.handleUserMessage(data.message);
                        break;
                }
            },
            undefined,
            []
        );

        webviewView.webview.html = getChatHtmlForWebview(webviewView.webview);
    }

    private async handleUserMessage(message: string) {
        if (!this._view) {
            return;
        }

        // Add user message to chat
        this._view.webview.postMessage({
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
        this._view.webview.postMessage({
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
                this._view.webview.postMessage({
                    type: 'updateMessage',
                    messageId: assistantMessageId,
                    text: fullText
                });
            }

            // Mark streaming as complete
            this._view.webview.postMessage({
                type: 'completeMessage',
                messageId: assistantMessageId
            });

        } catch (error) {
            console.error('Chat error:', error);
            // Handle error
            this._view.webview.postMessage({
                type: 'updateMessage',
                messageId: assistantMessageId,
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                isError: true
            });

            this._view.webview.postMessage({
                type: 'completeMessage',
                messageId: assistantMessageId
            });
        }
    }
}