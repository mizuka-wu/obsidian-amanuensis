/**
 * 服务器模块类型定义
 */

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	id?: string;
	timestamp?: number;
}

export interface ChatRequest {
	message: string;
	modelId: string;
}

export interface ChatResponseData {
	response?: string;
	error?: string;
}

export interface ModelsResponse {
	models: Array<{
		id: string;
		name: string;
		modelId: string;
		providerId: string;
		enabled: boolean;
	}>;
}

export interface ModelConfig {
	id: string;
	enabled: boolean;
	providerId: string;
	modelId: string;
}

export interface ProviderConfig {
	apiKey: string;
	baseUrl?: string;
}

export interface PluginSettings {
	models: ModelConfig[];
	providers: Record<string, ProviderConfig>;
}

export interface PluginInstance {
	settings: PluginSettings;
}
