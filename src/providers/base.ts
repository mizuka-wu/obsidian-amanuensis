import type { ProviderProfile } from "../types/settings";

export interface FetchedModel {
	id: string;
	name: string;
}

export interface ProviderConfig {
	defaultName: string;
	defaultBaseUrl: string;
	requiresApiKey: boolean;
	description: string;
	supportsBatchImport: boolean;
}

export interface ProviderImplementation {
	config: ProviderConfig;
	fetchModels?: (provider: ProviderProfile) => Promise<FetchedModel[]>;
}

/**
 * 清理 baseUrl，移除 /v1 或 /v1/ 后缀
 * 用于处理使用 OpenAI 兼容 API 路径的本地服务
 */
export function cleanBaseUrl(baseUrl: string): string {
	if (!baseUrl || !baseUrl.trim()) {
		throw new Error("Base URL 不能为空");
	}
	baseUrl = baseUrl.trim();
	if (baseUrl.endsWith("/v1/")) {
		baseUrl = baseUrl.slice(0, -4);
	} else if (baseUrl.endsWith("/v1")) {
		baseUrl = baseUrl.slice(0, -3);
	}
	// 确保没有尾部斜杠
	return baseUrl.replace(/\/$/, "");
}
