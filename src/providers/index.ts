import type { ProviderType } from "../types/settings";
import type {
	ProviderConfig,
	ProviderImplementation,
	FetchedModel,
} from "./base";
import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as ollama from "./ollama";
import * as lmstudio from "./lmstudio";
import * as custom from "./custom";

export type { ProviderConfig, ProviderImplementation, FetchedModel };

const providerImplementations: Record<ProviderType, ProviderImplementation> = {
	openai: openai.implementation,
	anthropic: anthropic.implementation,
	ollama: ollama.implementation,
	lmstudio: lmstudio.implementation,
	custom: custom.implementation,
};

/**
 * 获取 Provider 配置
 */
export function getProviderConfig(type: ProviderType): ProviderConfig {
	return providerImplementations[type].config;
}

/**
 * 获取 Provider 实现
 */
export function getProviderImplementation(
	type: ProviderType,
): ProviderImplementation {
	return providerImplementations[type];
}

/**
 * 检查 Provider 是否支持批量导入
 */
export function supportsBatchImport(type: ProviderType): boolean {
	return providerImplementations[type].config.supportsBatchImport;
}

/**
 * 获取 Provider 模型列表
 */
export async function fetchProviderModels(
	type: ProviderType,
	provider: Parameters<NonNullable<ProviderImplementation["fetchModels"]>>[0],
): Promise<FetchedModel[]> {
	const implementation = providerImplementations[type];
	if (implementation.fetchModels) {
		return await implementation.fetchModels(provider);
	}
	return [];
}
