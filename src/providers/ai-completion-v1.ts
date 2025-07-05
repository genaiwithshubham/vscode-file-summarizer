import { generateText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import * as vscode from 'vscode';


export class AICompletionProviderV1 implements vscode.CompletionItemProvider {
    private cache = new Map<string, vscode.CompletionItem[]>();

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
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
        // const endLine = Math.min(document.lineCount - 1, position.line + contextLines);
        
        const contextBefore = document.getText(new vscode.Range(startLine, 0, position.line, position.character));
        // const contextAfter = document.getText(new vscode.Range(position.line, position.character, endLine, document.lineAt(endLine).text.length));


        try {
            const completions = await this.getAICompletions(
                contextBefore,
                textBeforeCursor,
                textAfterCursor,
                document.languageId
            );

            return completions;
        } catch (error) {
            console.error('AI Completion Error:', error);
            return [];
        }
    }

    private async getAICompletions(
        contextBefore: string,
        textBeforeCursor: string,
        textAfterCursor: string,
        languageId: string
    ): Promise<vscode.CompletionItem[]> {
        const prompt = this.buildPrompt(contextBefore, textBeforeCursor, textAfterCursor, languageId);
        
        const ollama = createOllama({
            baseURL: 'http://localhost:11434/api',
        });
        const { text } = await generateText({
			model: ollama("llama3.2"),
			messages: [
                {
                    role: "system",
                    content:"You are a helpful code completion assistant. Provide multiple code completion suggestions based on the context. Return only the completion text without explanations. Each suggestion should be on a new line."
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
		});

        return this.parseCompletions(text);
    }

    private buildPrompt(contextBefore: string, textBeforeCursor: string, textAfterCursor: string, languageId: string): string {
        return `Complete the following ${languageId} code. Provide 3-5 different completion suggestions.

Context before cursor:
\`\`\`${languageId}
${contextBefore}
\`\`\`

Text after cursor:
\`\`\`${languageId}
${textAfterCursor}
\`\`\`

Provide completions for the cursor position. Each completion should be a logical continuation of the code.`;
    }

    private parseCompletions(completionText: string): vscode.CompletionItem[] {
        const lines = completionText.split('\n').filter(line => line.trim() !== '');
        const items: vscode.CompletionItem[] = [];

        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const suggestion = lines[i].trim();
            if (suggestion && suggestion.length > 0) {
                const item = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Text);
                item.insertText = suggestion;
                item.detail = `AI Suggestion ${i + 1}`;
                item.documentation = new vscode.MarkdownString(`AI-generated completion suggestion`);
                item.sortText = `00${i}`; // Ensure AI suggestions appear at the top
                
                // Make tab trigger the completion
                item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: 'Trigger Suggest'
                };
                
                items.push(item);
            }
        }

        return items;
    }
}