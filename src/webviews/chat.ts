import * as vscode from 'vscode';

export function getChatHtmlForWebview(webview: vscode.Webview) {
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
            flex-direction: column;
            padding: 10px;
            border-top: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-editor-background);
        }
        
        .current-file-display {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 0.9em;
        }
        
        .file-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }
        
        .current-file-info {
            flex: 1;
            min-width: 0;
        }
        
        .current-file-name {
            font-weight: 500;
            color: var(--vscode-foreground);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .current-file-path {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .change-file-button {
            padding: 4px 8px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.8em;
            flex-shrink: 0;
        }
        
        .change-file-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .file-search-container {
            position: relative;
            margin-bottom: 8px;
        }
        
        .file-search-input {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: inherit;
            font-size: inherit;
            box-sizing: border-box;
        }
        
        .file-search-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .file-search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .file-search-result {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-dropdown-border);
        }
        
        .file-search-result:last-child {
            border-bottom: none;
        }
        
        .file-search-result:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .file-search-result.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }
        
        .file-result-name {
            font-weight: 500;
            margin-bottom: 2px;
        }
        
        .file-result-path {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
        }
        
        .message-input-row {
            display: flex;
            gap: 8px;
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
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="messages-container" id="messagesContainer">
            <div class="empty-state">
                <h3>Start a conversation</h3>
                <p>Type your message below to begin chatting about your code</p>
            </div>
        </div>
        
        <div class="input-container">
            <div class="current-file-display" id="currentFileDisplay">
                <svg class="file-icon" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 1.5a.5.5 0 0 1 .5-.5h5.793a.5.5 0 0 1 .353.146l2.354 2.354a.5.5 0 0 1 .146.353V14.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V1.5zM4.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V4.207L9.793 2H4.5z"/>
                </svg>
                <div class="current-file-info">
                    <div class="current-file-name" id="currentFileName">No file selected</div>
                    <div class="current-file-path" id="currentFilePath">Select a file to chat about</div>
                </div>
                <button class="change-file-button" id="changeFileButton">Change File</button>
            </div>
            
            <div class="file-search-container hidden" id="fileSearchContainer">
                <input 
                    type="text" 
                    class="file-search-input" 
                    id="fileSearchInput" 
                    placeholder="Search files..."
                />
                <div class="file-search-results hidden" id="fileSearchResults"></div>
            </div>
            
            <div class="message-input-row">
                <textarea 
                    class="message-input" 
                    id="messageInput" 
                    placeholder="Ask about your code..."
                    rows="1"
                ></textarea>
                <button class="send-button" id="sendButton">Send</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const currentFileDisplay = document.getElementById('currentFileDisplay');
        const currentFileName = document.getElementById('currentFileName');
        const currentFilePath = document.getElementById('currentFilePath');
        const changeFileButton = document.getElementById('changeFileButton');
        const fileSearchContainer = document.getElementById('fileSearchContainer');
        const fileSearchInput = document.getElementById('fileSearchInput');
        const fileSearchResults = document.getElementById('fileSearchResults');
        
        let messages = [];
        let isStreaming = false;
        let currentFile = null;
        let searchResults = [];
        let selectedResultIndex = -1;
        let isSearching = false;
        
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
        
        // File search functionality
        changeFileButton.addEventListener('click', function() {
            isSearching = !isSearching;
            if (isSearching) {
                fileSearchContainer.classList.remove('hidden');
                fileSearchInput.focus();
                vscode.postMessage({ type: 'requestFileList' });
            } else {
                hideFileSearch();
            }
        });
        
        fileSearchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            filterFiles(query);
        });
        
        fileSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedResultIndex = Math.min(selectedResultIndex + 1, searchResults.length - 1);
                updateSelectedResult();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedResultIndex = Math.max(selectedResultIndex - 1, -1);
                updateSelectedResult();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
                    selectFile(searchResults[selectedResultIndex]);
                }
            } else if (e.key === 'Escape') {
                hideFileSearch();
            }
        });
        
        // Click outside to hide search
        document.addEventListener('click', function(e) {
            if (!fileSearchContainer.contains(e.target) && e.target !== changeFileButton) {
                hideFileSearch();
            }
        });
        
        function hideFileSearch() {
            fileSearchContainer.classList.add('hidden');
            fileSearchResults.classList.add('hidden');
            fileSearchInput.value = '';
            selectedResultIndex = -1;
            isSearching = false;
        }
        
        function filterFiles(query) {
            if (!query) {
                fileSearchResults.classList.add('hidden');
                return;
            }
            
            const filtered = allFiles.filter(file => 
                file.name.toLowerCase().includes(query) || 
                file.path.toLowerCase().includes(query)
            );
            
            searchResults = filtered;
            selectedResultIndex = -1;
            renderSearchResults();
        }
        
        function renderSearchResults() {
            if (searchResults.length === 0) {
                fileSearchResults.classList.add('hidden');
                return;
            }
            
            fileSearchResults.innerHTML = '';
            searchResults.forEach((file, index) => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'file-search-result';
                if (index === selectedResultIndex) {
                    resultDiv.classList.add('selected');
                }
                
                resultDiv.innerHTML = \`
                    <div class="file-result-name">\${file.name}</div>
                    <div class="file-result-path">\${file.path}</div>
                \`;
                
                resultDiv.addEventListener('click', () => selectFile(file));
                fileSearchResults.appendChild(resultDiv);
            });
            
            fileSearchResults.classList.remove('hidden');
        }
        
        function updateSelectedResult() {
            const results = fileSearchResults.querySelectorAll('.file-search-result');
            results.forEach((result, index) => {
                if (index === selectedResultIndex) {
                    result.classList.add('selected');
                } else {
                    result.classList.remove('selected');
                }
            });
        }
        
        function selectFile(file) {
            currentFile = file;
            currentFileName.textContent = file.name;
            currentFilePath.textContent = file.path;
            
            vscode.postMessage({
                type: 'selectFile',
                file: file
            });
            
            hideFileSearch();
        }
        
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isStreaming) return;
            
            vscode.postMessage({
                type: 'sendMessage',
                message: message,
                currentFile: currentFile
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
            // Remove empty state if it exists
            const emptyState = messagesContainer.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            
            messages.push(message);
            renderMessages();
        }
        
        function updateMessage(messageId, text, isError = false) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
                message.text = text;
                message.isError = isError;
                renderMessages();
            }
        }
        
        function completeMessage(messageId) {
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
        
        let allFiles = [];
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
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
                case 'setCurrentFile':
                    if (message.file) {
                        selectFile(message.file);
                    }
                    break;
                case 'setFileList':
                    allFiles = message.files;
                    break;
            }
        });
        
        // Focus input on load and request current file
        messageInput.focus();
        vscode.postMessage({ type: 'requestCurrentFile' });
    </script>
</body>
</html>`;
}