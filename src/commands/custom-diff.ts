import * as vscode from 'vscode';
import { CustomDiffData, CustomDiffProvider } from '../providers/custom-diff';

export function customDiff(context: vscode.ExtensionContext) {
    const provider = new CustomDiffProvider(context);

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            ['typescript'],
            provider
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('customDiff.acceptChange', (filePath: string, changeId: string) => {
            provider.acceptChange(filePath, changeId);
        }),

        vscode.commands.registerCommand('customDiff.rejectChange', (filePath: string, changeId: string) => {
            provider.rejectChange(filePath, changeId);
        }),

        vscode.commands.registerCommand('customDiff.viewDiff', (filePath: string, changeId: string) => {
            provider.showDiffDetails(filePath, changeId);
        }),

        vscode.commands.registerCommand('customDiff.acceptAll', () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                provider.acceptAll(activeEditor.document.uri.toString());
            }
        }),

        vscode.commands.registerCommand('customDiff.rejectAll', () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                provider.rejectAll(activeEditor.document.uri.toString());
            }
        }),

        vscode.commands.registerCommand('customDiff.loadDiff', () => {
            // Example: Load sample diff data
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const sampleDiff: CustomDiffData = {
                    filePath: activeEditor.document.uri.toString(),
                    changes: [
                        {
                            id: '1',
                            lineNumber: 6,
                            type: 'modified',
                            originalText: 'name: "Echo",',
                            newText: 'name: "Echo2",',
                            context: ['function example() {', '  // Some comment', '  console.log("Hello World");', '}'],
                            status: 'pending'
                        },
                        {
                            id: '2',
                            lineNumber: 21,
                            type: 'added',
                            originalText: '',
                            newText: '// This is a new comment',
                            status: 'pending'
                        }
                    ]
                };
                provider.loadCustomDiff(activeEditor.document.uri.toString(), sampleDiff);
                vscode.window.showInformationMessage('Custom diff loaded! Check the CodeLens actions.');
            }
        })
    );
}