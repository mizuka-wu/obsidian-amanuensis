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

	async processMessage(
		userMessage: string,
		modelId: string,
	): Promise<string> {
		this.addMessage("user", userMessage);

		const response = await this.generateResponse(userMessage, modelId);

		this.addMessage("assistant", response);

		return response;
	}

	private async generateResponse(
		userMessage: string,
		modelId: string,
	): Promise<string> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
			const plugin = (globalThis as any).__amanuensisPlugin;
			if (!plugin) {
				return "错误: 无法访问插件配置";
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const settings = plugin.settings;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (!settings || !Array.isArray(settings.models)) {
				return "错误: 模型配置无效";
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const model = settings.models.find((m: any) => m.id === modelId);
			if (!model) {
				return "错误: 模型未找到";
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (!model.enabled) {
				return "错误: 选定的模型已禁用";
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const providers = settings.providers;
			if (!providers || typeof providers !== "object") {
				return "错误: 提供商配置无效";
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const provider = providers[model.providerId];
			if (!provider) {
				return "错误: 模型的提供商配置未找到";
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (!provider.apiKey) {
				return "错误: 模型的 API 密钥未配置";
			}

			const response = await this.callModelWithMastra(
				userMessage,
				model,
				provider,
			);

			return response;
		} catch (error) {
			console.error("Error generating response:", error);
			const errorMsg =
				error instanceof Error ? error.message : String(error);

			return `错误: ${errorMsg}`;
		}
	}

	private async callModelWithMastra(
		userMessage: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		model: any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider: any,
	): Promise<string> {
		try {
			const { createChatAgent } = await import("./mastra");

			const agent = createChatAgent(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
				model.modelId,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
				provider.apiKey,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
				provider.baseUrl,
			);

			const result = await agent.generate([
				{
					role: "user",
					content: userMessage,
				},
			]);

			if (result && result.text) {
				return result.text;
			}

			return "模型未返回响应";
		} catch (error) {
			console.error("Mastra call error:", error);
			const errorMsg =
				error instanceof Error ? error.message : String(error);
			return `模型调用失败: ${errorMsg}`;
		}
	}
}
