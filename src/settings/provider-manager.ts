import type { ProviderProfile, ProviderType } from "../types/settings";
import { generateUUID } from "../utils/uuid";
import { fetchProviderModels, type FetchedModel } from "../providers";

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

	/**
	 * 获取 Provider 的可用模型列表
	 * 使用新的 providers 模块
	 */
	async getProviderModels(
		provider: ProviderProfile,
	): Promise<FetchedModel[]> {
		return await fetchProviderModels(provider.type, provider);
	}
}
