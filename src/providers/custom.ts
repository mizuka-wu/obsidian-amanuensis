import type { ProviderConfig, ProviderImplementation } from "./base";

export const config: ProviderConfig = {
	defaultName: "",
	defaultBaseUrl: "",
	requiresApiKey: false,
	description: "OpenAI-compatible API",
	supportsBatchImport: false,
};

// Custom Provider 不支持批量导入
export const implementation: ProviderImplementation = {
	config,
};
