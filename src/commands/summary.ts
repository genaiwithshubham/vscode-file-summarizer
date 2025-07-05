import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateSummary } from '../providers/ai-summary';
import { getWebviewContent } from '../webviews/summary';

export const summaryCommandDisposable = vscode.commands.registerCommand('fileSummarizer.summarize', async (uri: vscode.Uri) => {
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