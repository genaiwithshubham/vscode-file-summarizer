import * as vscode from 'vscode';
import { AICompletionProviderV2 } from '../providers/ai-completion-v2';

export function aiCompletionAdvanced(){
    const provider = new AICompletionProviderV2();

    // Register inline completion provider for TypeScript and TSX files
    const tsProvider = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file', language: 'typescript' },
        provider
    );

    const tsxProvider = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file', language: 'typescriptreact' },
        provider
    );

    // Register commands
    const enableCommand = vscode.commands.registerCommand('ai-autocomplete.enable', () => {
        vscode.workspace.getConfiguration('aiAutoComplete').update('enabled', true, true);
        vscode.window.showInformationMessage('AI Auto Complete enabled');
    });

    const disableCommand = vscode.commands.registerCommand('ai-autocomplete.disable', () => {
        vscode.workspace.getConfiguration('aiAutoComplete').update('enabled', false, true);
        vscode.window.showInformationMessage('AI Auto Complete disabled');
    });

    // Register accept command (triggered when user accepts inline completion)
    const acceptCommand = vscode.commands.registerCommand('ai-autocomplete.accept', () => {
        // This command is triggered when the inline completion is accepted
        // The actual insertion is handled by VS Code's inline completion system
        console.log('AI suggestion accepted');
    });

    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(robot) AI Complete';
    statusBarItem.tooltip = 'AI Auto Complete is active';
    statusBarItem.show();

    // Update status bar based on configuration
    const updateStatusBar = () => {
        const config = vscode.workspace.getConfiguration('aiAutoComplete');
        const enabled = config.get('enabled', true);
        statusBarItem.text = enabled ? '$(robot) AI Complete' : '$(robot) AI Complete (disabled)';
        statusBarItem.color = enabled ? undefined : 'yellow';
    };

    // Listen for configuration changes
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
        acceptCommand,
        statusBarItem,
        configListener
    };
}