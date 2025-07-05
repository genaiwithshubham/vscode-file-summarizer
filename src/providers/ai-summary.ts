import { generateText } from "ai";
import { createOllama } from "ollama-ai-provider";

export async function generateSummary(fileContent: string, fileName: string, model: string): Promise<string> {
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

        const ollama = createOllama({
            baseURL: 'http://localhost:11434/api',
        });

        const { text } = await generateText({
            model: ollama(model),
            prompt: prompt
        });

        return text;
    } catch (error) {
        throw error;
    }
}
