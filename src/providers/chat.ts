import * as vscode from 'vscode';
import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'chatView';
    
    private _view?: vscode.WebviewView;
    
    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('ChatViewProvider constructor called');
    }
    
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        console.log('resolveWebviewView called');
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        // Handle messages from the webview
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
    
    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            margin-bottom: 10px;
        }
        
        .message {
            margin: 10px 0;
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 90%;
            word-wrap: break-word;
        }
        
        .message.user {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
            text-align: right;
        }
        
        .message.assistant {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            margin-right: auto;
        }
        
        .message.streaming {
            position: relative;
        }
        
        .message.streaming::after {
            content: '▊';
            animation: blink 1s infinite;
            margin-left: 2px;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        .message-header {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        
        .message-content {
            white-space: pre-wrap;
            line-height: 1.4;
        }
        
        .input-container {
            display: flex;
            padding: 10px;
            border-top: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-editor-background);
        }
        
        .message-input {
            flex: 1;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: inherit;
            font-size: inherit;
            resize: none;
            min-height: 20px;
            max-height: 100px;
        }
        
        .message-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .send-button {
            margin-left: 8px;
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: inherit;
        }
        
        .send-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state h3 {
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        
        .empty-state p {
            margin: 0;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="messages-container" id="messagesContainer">
            <div class="empty-state">
                <h3>Start a conversation</h3>
                <p>Type your message below to begin chatting</p>
            </div>
        </div>
        
        <div class="input-container">
            <textarea 
                class="message-input" 
                id="messageInput" 
                placeholder="Type your message..."
                rows="1"
            ></textarea>
            <button class="send-button" id="sendButton">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        console.log('Webview script loaded');
        
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        
        let messages = [];
        let isStreaming = false;
        
        console.log('Elements found:', {
            messagesContainer: !!messagesContainer,
            messageInput: !!messageInput,
            sendButton: !!sendButton
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        
        // Send message on Enter (but allow Shift+Enter for new line)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        sendButton.addEventListener('click', sendMessage);
        
        function sendMessage() {
            const message = messageInput.value.trim();
            console.log('Sending message:', message);
            if (!message || isStreaming) return;
            
            vscode.postMessage({
                type: 'sendMessage',
                message: message
            });
            
            messageInput.value = '';
            messageInput.style.height = 'auto';
            isStreaming = true;
            updateSendButton();
        }
        
        function updateSendButton() {
            sendButton.disabled = isStreaming;
            sendButton.textContent = isStreaming ? 'Sending...' : 'Send';
        }
        
        function addMessage(message) {
            console.log('Adding message:', message);
            // Remove empty state if it exists
            const emptyState = messagesContainer.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            
            messages.push(message);
            renderMessages();
        }
        
        function updateMessage(messageId, text, isError = false) {
            console.log('Updating message:', messageId, text?.substring(0, 50) + '...');
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.text = text;
                message.isError = isError;
                renderMessages();
            }
        }
        
        function completeMessage(messageId) {
            console.log('Completing message:', messageId);
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.isStreaming = false;
                renderMessages();
            }
            isStreaming = false;
            updateSendButton();
        }
        
        function renderMessages() {
            messagesContainer.innerHTML = '';
            
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${message.isUser ? 'user' : 'assistant'}\${message.isStreaming ? ' streaming' : ''}\`;
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'message-header';
                headerDiv.textContent = \`\${message.isUser ? 'You' : 'Assistant'} • \${message.timestamp}\`;
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.textContent = message.text;
                
                if (message.isError) {
                    contentDiv.style.color = 'var(--vscode-errorForeground)';
                }
                
                messageDiv.appendChild(headerDiv);
                messageDiv.appendChild(contentDiv);
                messagesContainer.appendChild(messageDiv);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message from extension:', message);
            
            switch (message.type) {
                case 'addMessage':
                    addMessage(message.message);
                    break;
                case 'updateMessage':
                    updateMessage(message.messageId, message.text, message.isError);
                    break;
                case 'completeMessage':
                    completeMessage(message.messageId);
                    break;
            }
        });
        
        // Focus input on load
        messageInput.focus();
        console.log('Webview initialization complete');
    </script>
</body>
</html>`;
    }
}
