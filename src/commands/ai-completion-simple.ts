import * as vscode from 'vscode';
import { AICompletionProviderV1 } from '../providers/ai-completion-v1';

export function aiCompletionSimple() {
    const provider = new AICompletionProviderV1();

    const tsProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'typescript' },
        provider,
        '.', // Trigger on dot
        ' ', // Trigger on space
        '\n' // Trigger on new line
    );

    const tsxProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'typescriptreact' },
        provider,
        '.', // Trigger on dot
        ' ', // Trigger on space
        '\n' // Trigger on new line
    );

    const enableCommand = vscode.commands.registerCommand('ai-autocomplete.enable', () => {
        vscode.workspace.getConfiguration('aiAutoComplete').update('enabled', true, true);
        vscode.window.showInformationMessage('AI Auto Complete enabled');
    });

    const disableCommand = vscode.commands.registerCommand('ai-autocomplete.disable', () => {
        vscode.workspace.getConfiguration('aiAutoComplete').update('enabled', false, true);
        vscode.window.showInformationMessage('AI Auto Complete disabled');
    });

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(robot) AI Complete';
    statusBarItem.tooltip = 'AI Auto Complete is active';
    statusBarItem.show();

    const updateStatusBar = () => {
        const config = vscode.workspace.getConfiguration('aiAutoComplete');
        const enabled = config.get('enabled', true);
        statusBarItem.text = enabled ? '$(robot) AI Complete' : '$(robot) AI Complete (disabled)';
        statusBarItem.color = enabled ? undefined : 'yellow';
    };

    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('aiAutoComplete')) {
            updateStatusBar();
        }
    });

    updateStatusBar();

    return {
        tsProvider,
        tsxProvider, 
        enableCommand,
        disableCommand,
        statusBarItem,
        configListener
    };
}