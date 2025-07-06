import * as vscode from 'vscode';
import { summaryCommandDisposable } from './commands/summary';
import { aiCompletionAdvanced } from './commands/ai-completion-advanced';
import { customDiff } from './commands/custom-diff';


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

}

export function deactivate() { }