import {
	Setting,
	Modal,
	Notice,
	App,
	ButtonComponent,
	getIcon,
} from "obsidian";
import type AmanuensisPlugin from "../../main";
import { ModelManager } from "../model-manager";
import { ProviderManager } from "../provider-manager";
import type { ProviderProfile } from "../../types/settings";
import { supportsBatchImport, type FetchedModel } from "../../providers";
import * as CONST from "../../const";
import { ConfirmModal } from "../../settings";

// 待添加的模型项
interface PendingModel {
	id: string;
	name: string;
	modelId: string;
	providerId: string;
	providerName: string;
	supportsVision: boolean;
	supportsToolUse: boolean;
}

// 统一的模型配置弹窗
interface ModelConfig {
	name: string;
	supportsVision: boolean;
	supportsToolUse: boolean;
}

class ModelConfigModal extends Modal {
	initialConfig: ModelConfig;
	onConfirm: (config: ModelConfig) => void;
	modelId: string;

	nameInput: HTMLInputElement | null = null;
	supportsVisionInput: HTMLInputElement | null = null;
	supportsToolUseInput: HTMLInputElement | null = null;

	constructor(
		app: App,
		modelId: string,
		initialConfig: ModelConfig,
		onConfirm: (config: ModelConfig) => void,
	) {
		super(app);
		this.modelId = modelId;
		this.initialConfig = initialConfig;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText("配置模型");

		contentEl.createEl("p", {
			text: `模型 ID: ${this.modelId}`,
			cls: "setting-item-description",
		});

		new Setting(contentEl).setName("显示名称").addText((text) => {
			this.nameInput = text.inputEl;
			text.setValue(this.initialConfig.name);
		});

		new Setting(contentEl)
			.setName("支持 vision")
			.setDesc("此模型是否支持图像识别功能")
			.addToggle((toggle) => {
				this.supportsVisionInput = toggle.toggleEl as HTMLInputElement;
				toggle.setValue(this.initialConfig.supportsVision);
			});

		new Setting(contentEl)
			.setName("支持 tool use")
			.setDesc("此模型是否支持函数调用功能")
			.addToggle((toggle) => {
				this.supportsToolUseInput = toggle.toggleEl as HTMLInputElement;
				toggle.setValue(this.initialConfig.supportsToolUse);
			});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText("取消").onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn.setButtonText("保存")
					.setCta()
					.onClick(() => {
						const config: ModelConfig = {
							name:
								this.nameInput?.value.trim() ||
								this.initialConfig.name,
							supportsVision:
								this.supportsVisionInput?.checked || false,
							supportsToolUse:
								this.supportsToolUseInput?.checked || false,
						};
						this.onConfirm(config);
						this.close();
					});
			});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class AddModelModal extends Modal {
	plugin: AmanuensisPlugin;
	onSave: (
		models: {
			name: string;
			modelId: string;
			providerId: string;
			supportsVision: boolean;
			supportsToolUse: boolean;
		}[],
	) => Promise<void>;

	providerManager: ProviderManager;
	modelManager: ModelManager;

	pendingModels: PendingModel[] = [];
	pendingListContainer: HTMLElement | null = null;
	currentProvider: ProviderProfile | null = null;
	selectedModel: FetchedModel | null = null;

	modelInputContainer: HTMLElement | null = null;
	modelInput: HTMLInputElement | null = null;
	modelDropdown: HTMLElement | null = null;
	addButton: HTMLButtonElement | null = null;

	availableModels: FetchedModel[] = [];
	private loadModelsRequestId: number = 0;

	confirmButton: ButtonComponent | null = null;

	constructor(
		app: App,
		plugin: AmanuensisPlugin,
		onSave: (
			models: {
				name: string;
				modelId: string;
				providerId: string;
				supportsVision: boolean;
				supportsToolUse: boolean;
			}[],
		) => void | Promise<void>,
	) {
		super(app);
		this.plugin = plugin;
		this.onSave = async (models) => {
			const result = onSave(models);
			if (result instanceof Promise) {
				await result;
			}
		};
		this.providerManager = new ProviderManager(plugin.settings.providers);
		this.modelManager = new ModelManager(
			plugin.settings.models,
			plugin.settings.defaultModelId,
		);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.pendingModels = [];

		this.titleEl.setText(CONST.MODEL_MODAL_TITLE);

		const providers = this.providerManager.getAllProviders();

		if (providers.length === 0) {
			contentEl.createEl("p", {
				text: CONST.MODEL_MODAL_NO_PROVIDERS,
				cls: "setting-item-description",
			});
			return;
		}

		this.pendingListContainer = contentEl.createEl("div", {
			cls: "pending-models-section",
		});
		this.renderPendingList();

		contentEl.createEl("hr", { cls: "model-add-divider" });

		const addSection = contentEl.createEl("div", {
			cls: "model-add-section",
		});

		const providerContainer = addSection.createEl("div", {
			cls: "model-add-provider",
		});

		const providerSelect = providerContainer.createEl("select", {
			cls: "dropdown",
		});
		providers.forEach((provider) => {
			providerSelect.createEl("option", {
				value: provider.id,
				text: `${provider.name} (${provider.type})`,
			});
		});

		if (providers.length > 0) {
			this.currentProvider = providers[0] ?? null;
		}

		providerSelect.addEventListener("change", () => {
			const providerId = providerSelect.value;
			const provider = this.providerManager.getProviderById(providerId);
			this.currentProvider = provider ?? null;
			this.selectedModel = null;
			if (this.modelInput) {
				this.modelInput.value = "";
				this.modelInput.placeholder = "点击选择或输入 ID";
			}
			this.updateAddButton();
		});

		this.modelInputContainer = addSection.createEl("div", {
			cls: "model-add-input-container",
		});

		this.modelInput = this.modelInputContainer.createEl("input", {
			type: "text",
			cls: "model-add-input",
			placeholder: "点击选择或输入 id",
		});

		this.modelDropdown = this.modelInputContainer.createEl("div", {
			cls: "model-autocomplete-dropdown is-hidden",
		});

		this.modelInput.addEventListener("focus", () => {
			if (!this.currentProvider) {
				new Notice("请先选择 provider");
				this.modelInput?.blur();
				return;
			}
			void this.loadAndShowModels();
		});

		this.modelInput.addEventListener("input", () => {
			this.updateAddButton();
			this.filterModelDropdown();
		});

		document.addEventListener("click", (e) => {
			if (
				this.modelInputContainer &&
				!this.modelInputContainer.contains(e.target as Node)
			) {
				this.hideModelDropdown();
			}
		});

		const addBtnContainer = addSection.createEl("div", {
			cls: "model-add-button-container",
		});
		this.addButton = addBtnContainer.createEl("button", {
			cls: "mod-cta",
			text: "添加",
		});
		this.addButton.disabled = true;
		this.addButton.addEventListener("click", () => {
			if (!this.currentProvider || !this.modelInput) return;

			const inputValue = this.modelInput.value.trim();
			if (!inputValue) return;

			this.addPendingModel(inputValue, inputValue, false, false);

			this.selectedModel = null;
			this.modelInput.value = "";
			this.updateAddButton();
		});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(CONST.MODEL_MODAL_CANCEL).onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn.setButtonText("确定")
					.setCta()
					.setDisabled(true)
					.onClick(() => {
						void this.saveAll();
					});
				this.confirmButton = btn;
			});
	}

	private updateAddButton(): void {
		if (this.addButton && this.modelInput) {
			this.addButton.disabled = !this.modelInput.value.trim();
		}
	}

	private async loadAndShowModels(): Promise<void> {
		if (!this.modelDropdown || !this.currentProvider) {
			return;
		}

		this.modelDropdown.empty();
		this.modelDropdown.removeClass("is-hidden");
		this.modelDropdown.createEl("div", {
			cls: "model-autocomplete-loading",
			text: "加载中...",
		});

		const currentRequestId = ++this.loadModelsRequestId;

		try {
			const supportsBatch = supportsBatchImport(
				this.currentProvider.type,
			);

			if (!supportsBatch) {
				this.modelDropdown.empty();
				this.modelDropdown.createEl("div", {
					cls: "model-autocomplete-empty",
					text: "此来源不支持获取模型列表",
				});
				return;
			}

			const models = await this.providerManager.getProviderModels(
				this.currentProvider,
			);

			if (currentRequestId !== this.loadModelsRequestId) return;

			const allExistingModels = this.modelManager.getAllModels();
			const existingInManager = allExistingModels
				.filter((m) => m.providerId === this.currentProvider!.id)
				.map((m) => m.modelId);
			const existingPending = this.pendingModels
				.filter((m) => m.providerId === this.currentProvider!.id)
				.map((m) => m.modelId);

			const existingIds = new Set([
				...existingInManager,
				...existingPending,
			]);

			this.availableModels = models.filter((m) => !existingIds.has(m.id));
			this.renderModelDropdown();
		} catch (error) {
			if (currentRequestId !== this.loadModelsRequestId) return;
			this.modelDropdown.empty();
			this.modelDropdown.createEl("div", {
				cls: "model-autocomplete-empty",
				text: `加载失败: ${error instanceof Error ? error.message : String(error)}`,
			});
		}
	}

	private renderModelDropdown(): void {
		if (!this.modelDropdown || !this.modelInput) return;
		this.modelDropdown.empty();

		const inputRect = this.modelInput.getBoundingClientRect();
		const dropdownHeight = 200;
		const spaceBelow = window.innerHeight - inputRect.bottom;
		const spaceAbove = inputRect.top;

		if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
			this.modelDropdown.style.top = `${Math.max(0, inputRect.top - dropdownHeight - 8)}px`;
		} else {
			this.modelDropdown.style.top = `${inputRect.bottom + 8}px`;
		}

		this.modelDropdown.style.left = `${inputRect.left}px`;
		this.modelDropdown.style.width = `${inputRect.width}px`;
		this.modelDropdown.style.maxHeight = `${dropdownHeight}px`;

		if (this.availableModels.length === 0) {
			this.modelDropdown.createEl("div", {
				cls: "model-autocomplete-empty",
				text: "没有可用模型",
			});
			return;
		}

		this.availableModels.forEach((model) => {
			const item = this.modelDropdown!.createEl("div", {
				cls: "model-autocomplete-item",
			});
			item.createEl("span", {
				text: model.name,
				cls: "model-autocomplete-name",
			});
			item.createEl("span", {
				text: model.id,
				cls: "model-autocomplete-id",
			});

			item.addEventListener("click", () => {
				this.addPendingModel(model.name, model.id, false, false);
				this.hideModelDropdown();
				this.modelInput!.value = "";
				this.updateAddButton();
			});
		});
	}

	private filterModelDropdown(): void {
		if (!this.modelDropdown) return;

		const query = this.modelInput?.value.toLowerCase() || "";
		const items = this.modelDropdown.querySelectorAll(
			".model-autocomplete-item",
		);

		items.forEach((item) => {
			const nameEl = item.querySelector(".model-autocomplete-name");
			const idEl = item.querySelector(".model-autocomplete-id");
			const text =
				(nameEl?.textContent || "") + (idEl?.textContent || "");
			(item as HTMLElement).style.display = text
				.toLowerCase()
				.includes(query)
				? ""
				: "none";
		});
	}

	private hideModelDropdown(): void {
		this.modelDropdown?.addClass("is-hidden");
	}

	private updateConfirmButton(): void {
		if (this.confirmButton) {
			this.confirmButton.setDisabled(this.pendingModels.length === 0);
		}
	}

	private addPendingModel(
		name: string,
		modelId: string,
		supportsVision: boolean = false,
		supportsToolUse: boolean = false,
	): void {
		if (!this.currentProvider) return;

		const exists = this.pendingModels.some(
			(m) =>
				m.modelId === modelId &&
				m.providerId === this.currentProvider!.id,
		);
		if (exists) {
			new Notice(`模型 "${name}" 已在待添加列表中`);
			return;
		}

		const pendingModel: PendingModel = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
			name,
			modelId,
			providerId: this.currentProvider.id,
			providerName: this.currentProvider.name,
			supportsVision,
			supportsToolUse,
		};

		this.pendingModels.push(pendingModel);
		this.renderPendingList();
		this.updateConfirmButton();
	}

	private removePendingModel(id: string): void {
		this.pendingModels = this.pendingModels.filter((m) => m.id !== id);
		this.renderPendingList();
		this.updateConfirmButton();
	}

	private renderPendingList(): void {
		if (!this.pendingListContainer) return;

		this.pendingListContainer.empty();

		if (this.pendingModels.length === 0) {
			this.pendingListContainer.createEl("div", {
				cls: "pending-models-empty",
				text: "暂无待添加模型",
			});
			return;
		}

		const listContainer = this.pendingListContainer.createEl("div", {
			cls: "pending-models-list-header",
		});
		listContainer.createEl("span", {
			text: "名称",
			cls: "header-name",
		});
		listContainer.createEl("span", {
			text: "模型",
			cls: "header-model",
		});

		const listBody = this.pendingListContainer.createEl("div", {
			cls: "pending-models-list-body",
		});

		this.pendingModels.forEach((model) => {
			const item = listBody.createEl("div", {
				cls: "pending-model-row",
			});

			const infoContainer = item.createEl("div", {
				cls: "pending-model-info",
			});

			const nameRow = infoContainer.createEl("div", {
				cls: "pending-model-name-row",
			});
			nameRow.createEl("span", {
				text: model.name,
				cls: "pending-model-name",
			});
			if (model.supportsVision) {
				nameRow.createEl("span", {
					text: "👁️",
					cls: "pending-model-vision-badge",
					title: "支持 vision",
				});
			}
			if (model.supportsToolUse) {
				nameRow.createEl("span", {
					text: "🔧",
					cls: "pending-model-tool-badge",
					title: "支持 tool use",
				});
			}

			infoContainer.createEl("span", {
				text: model.modelId,
				cls: "pending-model-id",
			});

			const actionsContainer = item.createEl("div", {
				cls: "pending-model-actions-container",
			});

			const actions = actionsContainer.createEl("div", {
				cls: "pending-model-actions",
			});

			const editBtn = actions.createEl("button", {
				cls: "clickable-icon pending-model-edit",
			});
			editBtn.appendChild(
				getIcon("pencil") ?? document.createTextNode("✎"),
			);
			editBtn.addEventListener("click", () => {
				new ModelConfigModal(
					this.app,
					model.modelId,
					{
						name: model.name,
						supportsVision: model.supportsVision,
						supportsToolUse: model.supportsToolUse,
					},
					(config) => {
						const idx = this.pendingModels.findIndex(
							(m) => m.id === model.id,
						);
						if (idx !== -1) {
							this.pendingModels[idx] = {
								...model,
								name: config.name,
								supportsVision: config.supportsVision,
								supportsToolUse: config.supportsToolUse,
							};
							this.renderPendingList();
						}
					},
				).open();
			});

			const deleteBtn = actions.createEl("button", {
				cls: "clickable-icon pending-model-delete",
			});
			deleteBtn.appendChild(getIcon("x") ?? document.createTextNode("×"));
			deleteBtn.addEventListener("click", () => {
				this.removePendingModel(model.id);
			});
		});
	}

	private async saveAll(): Promise<void> {
		if (this.pendingModels.length === 0) return;

		const modelsToAdd = this.pendingModels.map((m) => ({
			name: m.name,
			modelId: m.modelId,
			providerId: m.providerId,
			supportsVision: m.supportsVision,
			supportsToolUse: m.supportsToolUse,
		}));

		try {
			await this.onSave(modelsToAdd);
			this.close();
		} catch (error) {
			console.error("Failed to add models:", error);
			new Notice(CONST.MODEL_SAVE_ERROR);
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ModelSection {
	private plugin: AmanuensisPlugin;
	private modelManager: ModelManager;
	private providerManager: ProviderManager;

	constructor(plugin: AmanuensisPlugin) {
		this.plugin = plugin;
		this.modelManager = new ModelManager(
			plugin.settings.models,
			plugin.settings.defaultModelId,
		);
		this.providerManager = new ProviderManager(plugin.settings.providers);
	}

	display(containerEl: HTMLElement, onRefresh: () => void): void {
		this.modelManager = new ModelManager(
			this.plugin.settings.models,
			this.plugin.settings.defaultModelId,
		);
		this.providerManager = new ProviderManager(
			this.plugin.settings.providers,
		);

		const hasProviders = this.providerManager.getAllProviders().length > 0;

		if (!hasProviders) {
			return;
		}

		new Setting(containerEl)
			.setName(CONST.MODEL_SECTION_TITLE)
			.setHeading();

		const models = this.modelManager.getAllModels();
		const defaultModelId = this.modelManager.getDefaultModelId();

		new Setting(containerEl)
			.setDesc(`你目前已经添加了 ${models.length} 个模型`)
			.addExtraButton((btn) => {
				btn.setIcon("circle-plus")
					.setTooltip("添加模型")
					.setDisabled(!hasProviders)
					.onClick(async () => {
						new AddModelModal(
							this.plugin.app,
							this.plugin,
							async (newModels) => {
								let successCount = 0;
								let failedCount = 0;
								for (const model of newModels) {
									try {
										this.modelManager.addModel(
											model.name,
											model.modelId,
											model.providerId,
											model.supportsVision,
											model.supportsToolUse,
										);
										successCount++;
									} catch (error) {
										failedCount++;
										console.error(
											`Failed to add model ${model.name}:`,
											error,
										);
									}
								}
								this.plugin.settings.models =
									this.modelManager.getAllModels();
								await this.plugin.saveSettings();

								if (failedCount === 0) {
									new Notice(
										CONST.MODEL_BATCH_SUCCESS(successCount),
									);
								} else {
									new Notice(
										CONST.MODEL_BATCH_PARTIAL(
											successCount,
											failedCount,
										),
									);
								}

								onRefresh();
							},
						).open();
					});
				if (!hasProviders) {
					btn.setTooltip(CONST.MODEL_ADD_TOOLTIP);
				}
			});

		if (models.length === 0) {
			containerEl.createEl("p", {
				text: CONST.MODEL_EMPTY_TEXT,
				cls: "setting-item-description",
			});
		} else {
			models.forEach((model) => {
				const provider = this.providerManager.getProviderById(
					model.providerId,
				);
				const providerName = provider
					? provider.name
					: CONST.MODEL_PROVIDER_UNKNOWN;

				let desc = `${CONST.MODEL_PROVIDER_PREFIX}${providerName}${CONST.MODEL_ID_PREFIX}${model.modelId}`;
				if (model.supportsVision) {
					desc += " [👁️]";
				}
				if (model.supportsToolUse) {
					desc += " [🔧]";
				}
				if (model.id === defaultModelId) {
					desc += CONST.MODEL_DEFAULT_BADGE;
				}

				const setting = new Setting(containerEl)
					.setName(model.name)
					.setDesc(desc);

				setting.addExtraButton((btn) => {
					btn.setIcon("settings")
						.setTooltip("配置模型")
						.onClick(() => {
							new ModelConfigModal(
								this.plugin.app,
								model.modelId,
								{
									name: model.name,
									supportsVision:
										model.supportsVision || false,
									supportsToolUse:
										model.supportsToolUse || false,
								},
								(config) => {
									void (async () => {
										this.modelManager.updateModel(
											model.id,
											{
												name: config.name,
												supportsVision:
													config.supportsVision,
												supportsToolUse:
													config.supportsToolUse,
											},
										);
										this.plugin.settings.models =
											this.modelManager.getAllModels();
										await this.plugin.saveSettings();
										onRefresh();
									})();
								},
							).open();
						});
				});

				if (model.enabled && model.id !== defaultModelId) {
					setting.addExtraButton((btn) => {
						btn.setIcon("star")
							.setTooltip("设为默认")
							.onClick(async () => {
								this.modelManager.setDefaultModel(model.id);
								this.plugin.settings.defaultModelId =
									this.modelManager.getDefaultModelId();
								await this.plugin.saveSettings();
								onRefresh();
							});
					});
				}

				setting.addExtraButton((btn) => {
					btn.setIcon("trash-2")
						.setTooltip("删除")
						.onClick(async () => {
							new ConfirmModal(
								this.plugin.app,
								CONST.MODEL_DELETE_CONFIRM(model.name),
								async () => {
									this.modelManager.deleteModel(model.id);
									this.plugin.settings.models =
										this.modelManager.getAllModels();
									this.plugin.settings.defaultModelId =
										this.modelManager.getDefaultModelId();
									await this.plugin.saveSettings();
									onRefresh();
								},
							).open();
						});
				});

				setting.addToggle((toggle) => {
					toggle.setValue(model.enabled).onChange(async (value) => {
						this.modelManager.toggleModelEnabled(model.id);
						this.plugin.settings.models =
							this.modelManager.getAllModels();
						await this.plugin.saveSettings();
						onRefresh();
					});
				});
			});
		}
	}
}
