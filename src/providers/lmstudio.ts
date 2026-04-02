import { requestUrl } from "obsidian";
import type {
	ProviderConfig,
	ProviderImplementation,
	FetchedModel,
} from "./base";
import { cleanBaseUrl } from "./base";
import type { ProviderProfile } from "../types/settings";

export const config: ProviderConfig = {
	defaultName: "LM Studio",
	defaultBaseUrl: "http://localhost:1234/v1",
	requiresApiKey: false,
	description: "Local LM Studio instance",
	supportsBatchImport: true,
};

interface LMStudioModel {
	id: string;
	object: string;
}

interface LMStudioResponse {
	data?: LMStudioModel[];
}

export async function fetchModels(
	provider: ProviderProfile,
): Promise<FetchedModel[]> {
	try {
		// 使用共享函数清理 baseUrl，处理 /v1 后缀
		const baseUrl = cleanBaseUrl(provider.baseUrl);

		const response = await requestUrl({
			url: `${baseUrl}/api/v1/models`,
			method: "GET",
		});

		const data = response.json as LMStudioResponse;
		return (
			data.data?.map((m) => ({
				id: m.id,
				name: m.id,
			})) || []
		);
	} catch (error) {
		console.error("Failed to fetch LM Studio models:", error);
		throw new Error(
			error instanceof Error
				? `无法获取 LM Studio 模型列表: ${error.message}`
				: "无法获取 LM Studio 模型列表，请检查服务是否运行",
		);
	}
}

export const implementation: ProviderImplementation = {
	config,
	fetchModels,
};
