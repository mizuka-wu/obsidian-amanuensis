import { requestUrl } from "obsidian";
import type {
	ProviderConfig,
	ProviderImplementation,
	FetchedModel,
} from "./base";
import { cleanBaseUrl } from "./base";
import type { ProviderProfile } from "../types/settings";

export const config: ProviderConfig = {
	defaultName: "Ollama",
	defaultBaseUrl: "http://localhost:11434/v1",
	requiresApiKey: false,
	description: "Local Ollama instance",
	supportsBatchImport: true,
};

interface OllamaModel {
	name: string;
	model: string;
}

interface OllamaResponse {
	models?: OllamaModel[];
}

export async function fetchModels(
	provider: ProviderProfile,
): Promise<FetchedModel[]> {
	try {
		// 使用共享函数清理 baseUrl，处理 /v1 后缀
		const baseUrl = cleanBaseUrl(provider.baseUrl);

		const response = await requestUrl({
			url: `${baseUrl}/api/tags`,
			method: "GET",
		});

		const data = response.json as OllamaResponse;
		return (
			data.models?.map((m) => ({
				id: m.name,
				name: m.name,
			})) || []
		);
	} catch (error) {
		console.error("Failed to fetch Ollama models:", error);
		throw new Error(
			error instanceof Error
				? `无法获取 Ollama 模型列表: ${error.message}`
				: "无法获取 Ollama 模型列表，请检查服务是否运行",
		);
	}
}

export const implementation: ProviderImplementation = {
	config,
	fetchModels,
};
