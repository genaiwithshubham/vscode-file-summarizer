import * as vscode from 'vscode';

interface CustomDiffChange {
    id: string;
    lineNumber: number;
    type: 'added' | 'removed' | 'modified';
    originalText: string;
    newText: string;
    context?: string[];
    status: 'pending' | 'accepted' | 'rejected';
}

export interface CustomDiffData {
    filePath: string;
    changes: CustomDiffChange[];
}

export class CustomDiffProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    private diffData: Map<string, CustomDiffData> = new Map();
    private decorations: Map<string, vscode.TextEditorDecorationType[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {}

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const filePath = document.uri.toString();
        const diffData = this.diffData.get(filePath);
        
        if (!diffData) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];

        for (const change of diffData.changes) {
            if (change.status === 'pending') {
                const line = Math.max(0, change.lineNumber - 1);
                const range = new vscode.Range(line, 0, line, 0);

                // Accept button
                const acceptLens = new vscode.CodeLens(range, {
                    title: `✓ Accept`,
                    command: 'customDiff.acceptChange',
                    arguments: [filePath, change.id]
                });

                // Reject button
                const rejectLens = new vscode.CodeLens(range, {
                    title: `✗ Reject`,
                    command: 'customDiff.rejectChange',
                    arguments: [filePath, change.id]
                });

                // View diff button
                const viewLens = new vscode.CodeLens(range, {
                    title: `👁 View Diff`,
                    command: 'customDiff.viewDiff',
                    arguments: [filePath, change.id]
                });

                codeLenses.push(acceptLens, rejectLens, viewLens);
            }
        }

        return codeLenses;
    }

    public loadCustomDiff(filePath: string, customDiffData: CustomDiffData) {
        this.diffData.set(filePath, customDiffData);
        this.updateDecorations(filePath);
        this._onDidChangeCodeLenses.fire();
        
        // Set context for menu visibility
        vscode.commands.executeCommand('setContext', 'customDiff.hasChanges', true);
    }

    public acceptChange(filePath: string, changeId: string) {
        const diffData = this.diffData.get(filePath);
        if (!diffData) { return; };

        const change = diffData.changes.find(c => c.id === changeId);
        if (!change) { return; };

        change.status = 'accepted';
        this.applyChange(filePath, change);
        this.updateDecorations(filePath);
        this._onDidChangeCodeLenses.fire();
    }

    public rejectChange(filePath: string, changeId: string) {
        const diffData = this.diffData.get(filePath);
        if (!diffData) { return; };

        const change = diffData.changes.find(c => c.id === changeId);
        if (!change) { return; };

        change.status = 'rejected';
        this.updateDecorations(filePath);
        this._onDidChangeCodeLenses.fire();
    }

    public acceptAll(filePath: string) {
        const diffData = this.diffData.get(filePath);
        if (!diffData) { return; };

        for (const change of diffData.changes) {
            if (change.status === 'pending') {
                change.status = 'accepted';
                this.applyChange(filePath, change);
            }
        }
        this.updateDecorations(filePath);
        this._onDidChangeCodeLenses.fire();
    }

    public rejectAll(filePath: string) {
        const diffData = this.diffData.get(filePath);
        if (!diffData) { return; };

        for (const change of diffData.changes) {
            if (change.status === 'pending') {
                change.status = 'rejected';
            }
        }
        this.updateDecorations(filePath);
        this._onDidChangeCodeLenses.fire();
    }

    private async applyChange(filePath: string, change: CustomDiffChange) {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(filePath));
        const editor = await vscode.window.showTextDocument(document);

        const line = Math.max(0, change.lineNumber - 1);
        const lineText = document.lineAt(line).text;
        const range = new vscode.Range(line, 0, line, lineText.length);

        await editor.edit(editBuilder => {
            switch (change.type) {
                case 'added':
                    editBuilder.insert(range.start, change.newText + '\n');
                    break;
                case 'removed':
                    editBuilder.delete(range);
                    break;
                case 'modified':
                    editBuilder.replace(range, change.newText);
                    break;
            }
        });
    }

    private updateDecorations(filePath: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== filePath) { return; };

        // Clear existing decorations
        const existingDecorations = this.decorations.get(filePath) || [];
        existingDecorations.forEach(decoration => decoration.dispose());

        const diffData = this.diffData.get(filePath);
        if (!diffData) { return; };

        // Create new decorations
        const addedDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            isWholeLine: true,
            after: {
                contentText: ' (Added)',
                color: 'rgba(0, 255, 0, 0.8)'
            }
        });

        const removedDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            isWholeLine: true,
            after: {
                contentText: ' (Removed)',
                color: 'rgba(255, 0, 0, 0.8)'
            }
        });

        const modifiedDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 255, 0, 0.1)',
            border: '1px solid rgba(255, 255, 0, 0.3)',
            isWholeLine: true,
            after: {
                contentText: ' (Modified)',
                color: 'rgba(255, 255, 0, 0.8)'
            }
        });

        const acceptedDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 255, 0, 0.05)',
            after: {
                contentText: ' ✓ Accepted',
                color: 'rgba(0, 255, 0, 0.6)'
            }
        });

        const rejectedDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
            after: {
                contentText: ' ✗ Rejected',
                color: 'rgba(255, 0, 0, 0.6)'
            }
        });

        const decorations = [addedDecoration, removedDecoration, modifiedDecoration, acceptedDecoration, rejectedDecoration];
        this.decorations.set(filePath, decorations);

        // Apply decorations based on change status
        const addedRanges: vscode.Range[] = [];
        const removedRanges: vscode.Range[] = [];
        const modifiedRanges: vscode.Range[] = [];
        const acceptedRanges: vscode.Range[] = [];
        const rejectedRanges: vscode.Range[] = [];

        for (const change of diffData.changes) {
            const line = Math.max(0, change.lineNumber - 1);
            const range = new vscode.Range(line, 0, line, 0);

            if (change.status === 'accepted') {
                acceptedRanges.push(range);
            } else if (change.status === 'rejected') {
                rejectedRanges.push(range);
            } else {
                switch (change.type) {
                    case 'added':
                        addedRanges.push(range);
                        break;
                    case 'removed':
                        removedRanges.push(range);
                        break;
                    case 'modified':
                        modifiedRanges.push(range);
                        break;
                }
            }
        }

        editor.setDecorations(addedDecoration, addedRanges);
        editor.setDecorations(removedDecoration, removedRanges);
        editor.setDecorations(modifiedDecoration, modifiedRanges);
        editor.setDecorations(acceptedDecoration, acceptedRanges);
        editor.setDecorations(rejectedDecoration, rejectedRanges);
    }

    // public showDiffDetails(filePath: string, changeId: string) {
    //     const diffData = this.diffData.get(filePath);
    //     if (!diffData) { return; };

    //     const change = diffData.changes.find(c => c.id === changeId);
    //     if (!change) { return; };

    //     const diffText = this.generateDiffText(change);
        
    //     vscode.window.showInformationMessage(
    //         `Diff for line ${change.lineNumber}`,
    //         { modal: true, detail: diffText }
    //     );
    // }

    public showDiffDetails(filePath: string, changeId: string) {
        const diffData = this.diffData.get(filePath);
        if (!diffData) { return; };

        const change = diffData.changes.find(c => c.id === changeId);
        if (!change) { return; };

        this.toggleInlineDiff(filePath, change);
    }

    private toggleInlineDiff(filePath: string, change: CustomDiffChange) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== filePath) { return; };

        // Check if diff is already shown for this change
        const existingDiffKey = `${filePath}-${change.id}-diff`;
        const existingDecorations = this.decorations.get(existingDiffKey);
        
        if (existingDecorations) {
            // Hide existing diff
            existingDecorations.forEach(decoration => decoration.dispose());
            this.decorations.delete(existingDiffKey);
            return;
        }

        // Show inline diff
        this.showInlineDiff(filePath, change);
    }

    private showInlineDiff(filePath: string, change: CustomDiffChange) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== filePath) return;

        const diffLines = this.generateInlineDiffLines(change);
        const decorations: vscode.TextEditorDecorationType[] = [];

        diffLines.forEach((diffLine, index) => {
            const decoration = vscode.window.createTextEditorDecorationType({
                after: {
                    contentText: diffLine.text,
                    color: diffLine.color,
                    backgroundColor: diffLine.backgroundColor,
                    fontStyle: 'italic',
                    margin: '0 0 0 20px'
                },
                isWholeLine: false
            });

            decorations.push(decoration);

            // Apply decoration to the line below the changed line
            const targetLine = Math.max(0, change.lineNumber - 1 + index);
            const range = new vscode.Range(targetLine, Number.MAX_VALUE, targetLine, Number.MAX_VALUE);
            
            editor.setDecorations(decoration, [range]);
        });

        // Store decorations for cleanup
        const diffKey = `${filePath}-${change.id}-diff`;
        this.decorations.set(diffKey, decorations);
    }

    private cleanupInlineDiff(filePath: string, changeId: string) {
        const diffKey = `${filePath}-${changeId}-diff`;
        const existingDecorations = this.decorations.get(diffKey);
        
        if (existingDecorations) {
            existingDecorations.forEach(decoration => decoration.dispose());
            this.decorations.delete(diffKey);
        }
    }

    private generateInlineDiffLines(change: CustomDiffChange): { text: string, color: string, backgroundColor: string }[] {
        const lines: { text: string, color: string, backgroundColor: string }[] = [];

        switch (change.type) {
            case 'modified':
                lines.push({
                    text: `  - ${change.originalText}`,
                    color: 'rgba(255, 100, 100, 0.9)',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)'
                });
                lines.push({
                    text: `  + ${change.newText}`,
                    color: 'rgba(100, 255, 100, 0.9)',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)'
                });
                break;
            case 'added':
                lines.push({
                    text: `  + ${change.newText}`,
                    color: 'rgba(100, 255, 100, 0.9)',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)'
                });
                break;
            case 'removed':
                lines.push({
                    text: `  - ${change.originalText}`,
                    color: 'rgba(255, 100, 100, 0.9)',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)'
                });
                break;
        }

        return lines;
    }

    private generateDiffText(change: CustomDiffChange): string {
        let diffText = `Line ${change.lineNumber} - ${change.type.toUpperCase()}\n\n`;
        
        if (change.type === 'modified') {
            diffText += `- ${change.originalText}\n`;
            diffText += `+ ${change.newText}\n`;
        } else if (change.type === 'added') {
            diffText += `+ ${change.newText}\n`;
        } else if (change.type === 'removed') {
            diffText += `- ${change.originalText}\n`;
        }

        if (change.context && change.context.length > 0) {
            diffText += `\nContext:\n`;
            change.context.forEach((line, index) => {
                diffText += `  ${index + 1}: ${line}\n`;
            });
        }

        return diffText;
    }
}