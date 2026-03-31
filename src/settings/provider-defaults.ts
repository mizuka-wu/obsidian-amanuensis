import type { ProviderType } from "../types/settings";

export interface ProviderDefaults {
	defaultName: string;
	defaultBaseUrl: string;
	requiresApiKey: boolean;
	description: string;
}

export const PROVIDER_DEFAULTS: Record<ProviderType, ProviderDefaults> = {
	openai: {
		defaultName: "OpenAI",
		defaultBaseUrl: "https://api.openai.com/v1",
		requiresApiKey: true,
		description: "OpenAI API",
	},
	anthropic: {
		defaultName: "Anthropic",
		defaultBaseUrl: "https://api.anthropic.com",
		requiresApiKey: true,
		description: "Anthropic Claude API",
	},
	ollama: {
		defaultName: "Ollama",
		defaultBaseUrl: "http://localhost:11434/v1",
		requiresApiKey: false,
		description: "Local Ollama instance",
	},
	lmstudio: {
		defaultName: "LM Studio",
		defaultBaseUrl: "http://localhost:1234/v1",
		requiresApiKey: false,
		description: "Local LM Studio instance",
	},
	custom: {
		defaultName: "",
		defaultBaseUrl: "",
		requiresApiKey: false,
		description: "OpenAI-compatible API",
	},
};

export function getProviderDefaults(type: ProviderType): ProviderDefaults {
	return PROVIDER_DEFAULTS[type];
}
