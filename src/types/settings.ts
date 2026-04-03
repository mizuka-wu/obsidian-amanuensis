import { DEFAULT_PORT as SERVER_DEFAULT_PORT } from "../server";

export type ProviderType =
	| "openai"
	| "anthropic"
	| "ollama"
	| "lmstudio"
	| "custom";

export interface ProviderProfile {
	id: string;
	type: ProviderType;
	name: string;
	baseUrl: string;
	apiKey: string;
}

export interface ModelEntry {
	id: string;
	name: string;
	modelId: string;
	providerId: string;
	enabled: boolean;
	supportsVision?: boolean;
	supportsToolUse?: boolean;
}

export interface AmanuensisPluginSettings {
	port: string;
	providers: Record<string, ProviderProfile>;
	models: ModelEntry[];
	defaultModelId?: string;
}

export const DEFAULT_SETTINGS: AmanuensisPluginSettings = {
	port: String(SERVER_DEFAULT_PORT),
	providers: {},
	models: [],
	defaultModelId: undefined,
};
