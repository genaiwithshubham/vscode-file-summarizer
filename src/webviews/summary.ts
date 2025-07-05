export function getWebviewContent(fileName: string, summary: string, filePath: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Summary</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .file-info {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .file-path {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
            color: var(--vscode-textPreformat-foreground);
            word-break: break-all;
        }
        
        .summary-content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            white-space: pre-wrap;
        }
        
        .title {
            color: var(--vscode-titleBar-activeForeground);
            margin: 0 0 10px 0;
            font-size: 1.5em;
        }
        
        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin: 0;
            font-size: 1em;
        }
        
        .copy-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            margin-top: 15px;
        }
        
        .copy-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .timestamp {
            color: var(--vscode-descriptionForeground);
            font-size: 0.8em;
            margin-top: 20px;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">📄 File Summary</h1>
            <p class="subtitle">AI-generated analysis of your code file</p>
        </div>
        
        <div class="file-info">
            <strong>File:</strong> ${fileName}<br>
            <strong>Path:</strong> <span class="file-path">${filePath}</span>
        </div>
        
        <div class="summary-content">
${summary}
        </div>
        
        <button class="copy-button" onclick="copyToClipboard()">📋 Copy Summary</button>
        
        <div class="timestamp">
            Generated on: ${new Date().toLocaleString()}
        </div>
    </div>
    
    <script>
        function copyToClipboard() {
            const summaryText = document.querySelector('.summary-content').textContent;
            navigator.clipboard.writeText(summaryText).then(() => {
                const button = document.querySelector('.copy-button');
                const originalText = button.textContent;
                button.textContent = '✅ Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    </script>
</body>
</html>`;
}