import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createOllama } from 'ollama-ai-provider';
import { generateText } from 'ai';

const ollama = createOllama({
	baseURL: 'http://localhost:11434/api',
});

export function activate(context: vscode.ExtensionContext) {
	console.log('File Summarizer extension is now active!');

	const disposable = vscode.commands.registerCommand('fileSummarizer.summarize', async (uri: vscode.Uri) => {
		try {
			const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

			if (!fileUri) {
				vscode.window.showErrorMessage('No file selected');
				return;
			}

			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Summarizing file...",
				cancellable: false
			}, async (progress) => {
				try {
					const fileContent = await fs.promises.readFile(fileUri.fsPath, 'utf8');
					const fileName = path.basename(fileUri.fsPath);

					progress.report({ increment: 25, message: "Reading file..." });

					const config = vscode.workspace.getConfiguration('fileSummarizer');
					const model = config.get<string>('model', 'llama3.2');

					progress.report({ increment: 25, message: "Calling LLM..." });

					const summary = await generateSummary(fileContent, fileName, model);

					progress.report({ increment: 25, message: "Generating webview..." });

					// Create and show webview
					const panel = vscode.window.createWebviewPanel(
						'fileSummary',
						`Summary: ${fileName}`,
						vscode.ViewColumn.Beside,
						{
							enableScripts: true,
							retainContextWhenHidden: true
						}
					);

					panel.webview.html = getWebviewContent(fileName, summary, fileUri.fsPath);

					progress.report({ increment: 25, message: "Complete!" });

				} catch (error) {
					console.error('Error summarizing file:', error);
					vscode.window.showErrorMessage(`Error summarizing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
				}
			});

		} catch (error) {
			console.error('Error in summarize command:', error);
			vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	});

	context.subscriptions.push(disposable);
}

async function generateSummary(fileContent: string, fileName: string, model: string): Promise<string> {
	try {
		const prompt = `Please provide a comprehensive summary of this code file. Include:
		1. Purpose and main functionality
		2. Key components, classes, or functions
		3. Dependencies and imports
		4. Notable patterns or architectural decisions
		5. Any potential issues or improvements

		File: ${fileName}
		Content:
		${fileContent}`;

		const { text } = await generateText({
			model: ollama(model),
			prompt: prompt
		});

		return text;
	} catch (error) {
		throw error;
	}
}

function getWebviewContent(fileName: string, summary: string, filePath: string): string {
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

export function deactivate() { }