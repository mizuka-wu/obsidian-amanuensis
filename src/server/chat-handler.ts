import type {
	ChatMessage,
	ModelConfig,
	ProviderConfig,
	PluginInstance,
} from "./types";

export type { ChatMessage };

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

	resetConversation(): void {
		this.clearHistory();
	}

	deleteMessage(messageId: string): boolean {
		const index = this.conversationHistory.findIndex(
			(m) => m.id === messageId,
		);
		if (index !== -1) {
			this.conversationHistory.splice(index, 1);
			return true;
		}
		return false;
	}

	private async generateResponse(
		userMessage: string,
		modelId: string,
	): Promise<string> {
		try {
			const plugin = this.getPluginInstance();
			if (!plugin) {
				return "错误: 无法访问插件配置";
			}

			const settings = plugin.settings;
			if (!settings || !Array.isArray(settings.models)) {
				return "错误: 模型配置无效";
			}

			const model = this.findModel(settings.models, modelId);
			if (!model) {
				return "错误: 模型未找到";
			}

			if (!model.enabled) {
				return "错误: 选定的模型已禁用";
			}

			const providers = settings.providers;
			if (!providers || typeof providers !== "object") {
				return "错误: 提供商配置无效";
			}

			const provider = providers[model.providerId];
			if (!provider) {
				return "错误: 模型的提供商配置未找到";
			}

			if (!provider.apiKey) {
				return "错误: 模型的 API 密钥未配置";
			}

			return await this.callModelWithMastra(userMessage, model, provider);
		} catch (error) {
			console.error("Error generating response:", error);
			const errorMsg =
				error instanceof Error ? error.message : String(error);

			return `错误: ${errorMsg}`;
		}
	}

	private getPluginInstance(): PluginInstance | null {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
		const plugin = (globalThis as any).__amanuensisPlugin as
			| PluginInstance
			| undefined;
		return plugin || null;
	}

	private findModel(
		models: ModelConfig[],
		modelId: string,
	): ModelConfig | undefined {
		return models.find((m) => m.id === modelId);
	}

	private async callModelWithMastra(
		userMessage: string,
		model: ModelConfig,
		provider: ProviderConfig,
	): Promise<string> {
		try {
			const { createChatAgent } = await import("./mastra");

			const agent = createChatAgent(
				model.modelId,
				provider.apiKey,
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
