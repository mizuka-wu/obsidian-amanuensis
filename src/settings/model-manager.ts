import type { ModelEntry } from "../types/settings";
import { generateUUID } from "../utils/uuid";

export class ModelManager {
	private models: ModelEntry[];
	private defaultModelId: string | undefined;

	constructor(models: ModelEntry[] = [], defaultModelId?: string) {
		this.models = models;
		this.defaultModelId = defaultModelId;
	}

	addModel(
		name: string,
		modelId: string,
		providerId: string,
		supportsVision?: boolean,
		supportsToolUse?: boolean,
	): ModelEntry {
		if (!name || !modelId || !providerId) {
			throw new Error("Model name, modelId and providerId are required");
		}

		const id = generateUUID();
		const model: ModelEntry = {
			id,
			name,
			modelId,
			providerId,
			enabled: true,
			supportsVision,
			supportsToolUse,
		};

		this.models.push(model);
		return model;
	}

	updateModel(
		id: string,
		updates: Partial<Omit<ModelEntry, "id">>,
	): ModelEntry {
		const model = this.getModelById(id);
		if (!model) {
			throw new Error(`Model with id ${id} not found`);
		}

		Object.assign(model, updates);
		return model;
	}

	deleteModel(id: string): void {
		const index = this.models.findIndex((m) => m.id === id);
		if (index === -1) {
			throw new Error(`Model with id ${id} not found`);
		}

		this.models.splice(index, 1);

		if (this.defaultModelId === id) {
			this.defaultModelId = undefined;
		}
	}

	toggleModelEnabled(id: string): ModelEntry {
		const model = this.getModelById(id);
		if (!model) {
			throw new Error(`Model with id ${id} not found`);
		}

		model.enabled = !model.enabled;
		return model;
	}

	setDefaultModel(id: string): void {
		const model = this.getModelById(id);
		if (!model) {
			throw new Error(`Model with id ${id} not found`);
		}

		if (!model.enabled) {
			throw new Error("Cannot set disabled model as default");
		}

		this.defaultModelId = id;
	}

	getModelById(id: string): ModelEntry | undefined {
		return this.models.find((m) => m.id === id);
	}

	getEnabledModels(): ModelEntry[] {
		return this.models.filter((m) => m.enabled);
	}

	getDefaultModel(): ModelEntry | undefined {
		if (!this.defaultModelId) {
			return undefined;
		}

		const model = this.getModelById(this.defaultModelId);
		if (!model || !model.enabled) {
			return undefined;
		}

		return model;
	}

	getAllModels(): ModelEntry[] {
		return [...this.models];
	}

	getDefaultModelId(): string | undefined {
		return this.defaultModelId;
	}

	setDefaultModelId(id: string | undefined): void {
		this.defaultModelId = id;
	}
}
