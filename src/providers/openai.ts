import type {
	ProviderConfig,
	ProviderImplementation,
	FetchedModel,
} from "./base";
import type { ProviderProfile } from "../types/settings";

export const config: ProviderConfig = {
	defaultName: "OpenAI",
	defaultBaseUrl: "https://api.openai.com/v1",
	requiresApiKey: true,
	description: "OpenAI API",
	supportsBatchImport: false,
};

// OpenAI 模型列表 API 需要 API Key，返回空列表作为占位符
// 如需实现，需要提供 API Key 认证并调用 /v1/models 接口
// 以下函数为无操作占位符，暂不实现具体逻辑
export async function fetchModels(
	_provider: ProviderProfile,
): Promise<FetchedModel[]> {
	return [];
}

export const implementation: ProviderImplementation = {
	config,
	fetchModels,
};
