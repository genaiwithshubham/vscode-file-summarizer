import * as vscode from 'vscode';
import { summaryCommandDisposable } from './commands/summary';
import { aiCompletionAdvanced } from './commands/ai-completion-advanced';
import { customDiff } from './commands/custom-diff';
import { SimpleChatProvider } from './providers/simplechat';


export function activate(context: vscode.ExtensionContext) {
    const disposable = aiCompletionAdvanced();

    context.subscriptions.push(
        summaryCommandDisposable,
        disposable.tsProvider,
        disposable.tsxProvider,
        disposable.enableCommand,
        disposable.disableCommand,
        disposable.acceptCommand,
        disposable.statusBarItem,
        disposable.configListener,
    );

    customDiff(context);

    // const chatDisposable = vscode.commands.registerCommand('simpleChatExtension.openChat', () => {
    //     ChatPanel.createOrShow(context.extensionUri);
    // });

    // context.subscriptions.push(chatDisposable);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SimpleChatProvider.viewType,
            new SimpleChatProvider(context.extensionUri)
        )
    );

}

export function deactivate() { }