import { generateText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import * as vscode from 'vscode';


export class AICompletionProviderV2 implements vscode.InlineCompletionItemProvider {
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        const config = vscode.workspace.getConfiguration('aiAutoComplete');

        if (!config.get('enabled', true)) {
            return [];
        }

        // Get context around cursor
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);
        const textAfterCursor = lineText.substring(position.character);

        // Get surrounding context (previous and next lines)
        const contextLines = 5;
        const startLine = Math.max(0, position.line - contextLines);

        const contextBefore = document.getText(new vscode.Range(startLine, 0, position.line, position.character));

        try {
            const completion = await this.getAICompletion(
                contextBefore,
                textBeforeCursor,
                textAfterCursor,
                document.languageId
            );

            return [this.createInlineCompletionItem(completion.label as string, position)];
        } catch (error) {
            console.error('AI Completion Error:', error);
            return [];
        }
    }

    private createInlineCompletionItem(suggestion: string, position: vscode.Position): vscode.InlineCompletionItem {
        const item = new vscode.InlineCompletionItem(suggestion, new vscode.Range(position, position));
        item.command = {
            command: 'ai-autocomplete.accept',
            title: 'Accept AI Suggestion'
        };
        return item;
    }

    private async getAICompletion(
        contextBefore: string,
        textBeforeCursor: string,
        textAfterCursor: string,
        languageId: string
    ): Promise<vscode.CompletionItem> {
        const prompt = this.buildPrompt(contextBefore, textBeforeCursor, textAfterCursor, languageId);

        const ollama = createOllama({
            baseURL: 'http://localhost:11434/api',
        });
        const { text } = await generateText({
            model: ollama("llama3.2"),
            messages: [
                {
                    role: "system",
                    content: "You are a helpful code completion assistant. Provide single code completion suggestions based on the context. Return only the completion text without explanations."
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        return this.parseCompletion(text);
    }

    private buildPrompt(contextBefore: string, textBeforeCursor: string, textAfterCursor: string, languageId: string): string {
        return `Complete the following ${languageId} code. Provide only the next logical completion for the cursor position.
            Context before cursor:
            \`\`\`${languageId}
            ${contextBefore}
            \`\`\`

            Text after cursor:
            \`\`\`${languageId}
            ${textAfterCursor}
            \`\`\`

            Provide only the completion text that should be inserted at the cursor position. Do not include explanations or multiple options.`;
    }

    private parseCompletion(completionText: string): vscode.CompletionItem {
        const suggestion = completionText.trim();
        const items: vscode.CompletionItem[] = [];

        // if (suggestion && suggestion.length > 0) {
        const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
        item.insertText = suggestion;
        item.detail = `AI Suggestion`;
        item.documentation = new vscode.MarkdownString(`AI-generated completion suggestion`);
        // items.push(item);
        //}

        return item;
    }
}