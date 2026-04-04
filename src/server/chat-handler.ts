export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export class ChatHandler {
	private conversationHistory: ChatMessage[] = [];

	addMessage(role: "user" | "assistant", content: string): void {
		this.conversationHistory.push({ role, content });
	}

	getHistory(): ChatMessage[] {
		return this.conversationHistory;
	}

	clearHistory(): void {
		this.conversationHistory = [];
	}

	async processMessage(userMessage: string): Promise<string> {
		this.addMessage("user", userMessage);

		const response = await this.generateResponse(userMessage);

		this.addMessage("assistant", response);

		return response;
	}

	private async generateResponse(userMessage: string): Promise<string> {
		try {
			return `You said: "${userMessage}". This is a placeholder response. Configure your LLM provider in settings to enable real AI responses.`;
		} catch (error) {
			console.error("Error generating response:", error);
			return "Sorry, I encountered an error processing your message.";
		}
	}
}
