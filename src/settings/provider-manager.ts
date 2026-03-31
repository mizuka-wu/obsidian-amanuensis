import { requestUrl } from "obsidian";
import type { ProviderProfile, ProviderType } from "../types/settings";
import { generateUUID } from "../utils/uuid";

interface OllamaModel {
	name: string;
	model: string;
}

interface OllamaResponse {
	models?: OllamaModel[];
}

interface LMStudioModel {
	key: string;
	display_name: string;
	type: string;
}

interface LMStudioResponse {
	models?: LMStudioModel[];
}

export class ProviderManager {
	private providers: Record<string, ProviderProfile>;

	constructor(providers: Record<string, ProviderProfile> = {}) {
		this.providers = providers;
	}

	createProvider(
		type: ProviderType,
		name: string,
		baseUrl: string,
		apiKey: string,
	): ProviderProfile {
		if (!name || !baseUrl) {
			throw new Error("Provider name and baseUrl are required");
		}

		const id = generateUUID();
		const provider: ProviderProfile = {
			id,
			type,
			name,
			baseUrl,
			apiKey,
		};

		this.providers[id] = provider;
		return provider;
	}

	updateProvider(
		id: string,
		updates: Partial<Omit<ProviderProfile, "id">>,
	): ProviderProfile {
		const provider = this.providers[id];
		if (!provider) {
			throw new Error(`Provider with id ${id} not found`);
		}

		Object.assign(provider, updates);
		return provider;
	}

	deleteProvider(id: string): void {
		if (!this.providers[id]) {
			throw new Error(`Provider with id ${id} not found`);
		}
		delete this.providers[id];
	}

	getProviderById(id: string): ProviderProfile | undefined {
		return this.providers[id];
	}

	getAllProviders(): ProviderProfile[] {
		return Object.values(this.providers);
	}

	getProviders(): Record<string, ProviderProfile> {
		return { ...this.providers };
	}

	async fetchOllamaModels(
		baseUrl: string,
	): Promise<{ name: string; model: string }[]> {
		try {
			const response = await requestUrl({
				url: new URL("/api/tags", baseUrl).href,
				method: "GET",
			});
			const data = response.json as OllamaResponse;
			return (
				data.models?.map((m) => ({
					name: m.name,
					model: m.model,
				})) || []
			);
		} catch (error) {
			console.error("Error fetching Ollama models:", error);
			return [];
		}
	}

	async fetchLMStudioModels(
		baseUrl: string,
	): Promise<{ key: string; display_name: string }[]> {
		try {
			const response = await requestUrl({
				url: new URL("/api/v1/models", baseUrl).href,
				method: "GET",
			});
			const data = response.json as LMStudioResponse;
			const llmModels =
				data.models?.filter((m) => m.type === "llm") || [];
			return llmModels.map((m) => ({
				key: m.key,
				display_name: m.display_name,
			}));
		} catch (error) {
			console.error("Error fetching LM Studio models:", error);
			return [];
		}
	}

	async getProviderModels(
		provider: ProviderProfile,
	): Promise<{ id: string; name: string }[]> {
		const results: { id: string; name: string }[] = [];

		switch (provider.type) {
			case "ollama": {
				const ollamaModels = await this.fetchOllamaModels(
					provider.baseUrl,
				);
				ollamaModels.forEach((m) =>
					results.push({ id: m.name, name: m.name }),
				);
				break;
			}
			case "lmstudio": {
				const lmModels = await this.fetchLMStudioModels(
					provider.baseUrl,
				);
				lmModels.forEach((m) =>
					results.push({ id: m.key, name: m.display_name || m.key }),
				);
				break;
			}
			default:
				break;
		}

		return results;
	}
}
