import {
	Setting,
	Modal,
	DropdownComponent,
	TextComponent,
	Notice,
	App,
	ButtonComponent,
} from "obsidian";
import type AmanuensisPlugin from "../../main";
import { ModelManager } from "../model-manager";
import { ProviderManager } from "../provider-manager";
import type { ProviderProfile } from "../../types/settings";
import { supportsBatchImport, type FetchedModel } from "../../providers";
import * as CONST from "../../const";
import { ConfirmModal } from "../../settings";

class AddModelModal extends Modal {
	plugin: AmanuensisPlugin;
	onSave: (
		models: { name: string; modelId: string; providerId: string }[],
	) => Promise<void>;

	providerDropdown: DropdownComponent;
	nameInput: TextComponent;
	modelIdInput: TextComponent;
	providerManager: ProviderManager;
	modelManager: ModelManager;

	// 批量导入相关
	batchModelsContainer: HTMLElement | null = null;
	selectedModels: Set<string> = new Set();
	availableModels: FetchedModel[] = [];
	currentProvider: ProviderProfile | null = null;
	batchAddButton: ButtonComponent | null = null;
	// 竞态条件防护 - 使用简单标志
	private loadModelsRequestId: number = 0;
	// checkbox 事件监听器清理
	private checkboxListeners: Array<{
		element: HTMLInputElement;
		listener: EventListener;
	}> = [];

	constructor(
		app: App,
		plugin: AmanuensisPlugin,
		onSave: (
			models: { name: string; modelId: string; providerId: string }[],
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

		this.titleEl.setText(CONST.MODEL_MODAL_TITLE);

		const providers = this.providerManager.getAllProviders();

		if (providers.length === 0) {
			contentEl.createEl("p", {
				text: CONST.MODEL_MODAL_NO_PROVIDERS,
				cls: "setting-item-description",
			});
			return;
		}

		// Provider 选择
		new Setting(contentEl)
			.setName(CONST.MODEL_PROVIDER_LABEL)
			.setDesc(CONST.MODEL_PROVIDER_DESC)
			.addDropdown((dropdown) => {
				this.providerDropdown = dropdown;
				providers.forEach((provider) => {
					dropdown.addOption(
						provider.id,
						`${provider.name} (${provider.type})`,
					);
				});
				// 选择第一个 provider
				const firstProvider = providers[0];
				if (firstProvider) {
					dropdown.setValue(firstProvider.id);
					this.currentProvider = firstProvider;
					// 加载模型列表
					this.loadModelsForProvider(firstProvider).catch((error) => {
						console.error("Failed to load initial models:", error);
					});
				}

				dropdown.onChange(async (value) => {
					const provider =
						this.providerManager.getProviderById(value);
					if (provider) {
						this.currentProvider = provider;
						dropdown.setDisabled(true);
						try {
							await this.loadModelsForProvider(provider);
						} finally {
							dropdown.setDisabled(false);
						}
					}
				});
			});

		// 单个添加区域
		const singleAddSection = contentEl.createEl("div", {
			cls: "model-single-add-section",
		});

		new Setting(singleAddSection)
			.setName(CONST.MODEL_NAME_LABEL)
			.setDesc(CONST.MODEL_NAME_DESC)
			.addText((text) => {
				this.nameInput = text;
				text.setPlaceholder(CONST.MODEL_NAME_PLACEHOLDER);
			});

		new Setting(singleAddSection)
			.setName(CONST.MODEL_ID_LABEL)
			.setDesc(CONST.MODEL_ID_DESC)
			.addText((text) => {
				this.modelIdInput = text;
				text.setPlaceholder(CONST.MODEL_ID_PLACEHOLDER);
			});

		new Setting(singleAddSection).addButton((btn) => {
			btn.setButtonText(CONST.MODEL_MODAL_ADD)
				.setCta()
				.onClick(async () => {
					await this.saveSingle();
				});
		});

		// 分隔线
		contentEl.createEl("hr", { cls: "model-batch-divider" });

		// 批量导入区域
		const batchSection = contentEl.createEl("div", {
			cls: "model-batch-section",
		});

		batchSection.createEl("h3", { text: CONST.MODEL_BATCH_TITLE });

		// 批量操作按钮
		const batchButtonsRow = new Setting(batchSection);
		batchButtonsRow.settingEl.empty();
		batchButtonsRow.settingEl.addClass("model-batch-buttons-row");

		batchButtonsRow.addButton((btn) => {
			btn.setButtonText(CONST.MODEL_BATCH_SELECT_ALL)
				.setCta()
				.onClick(() => {
					this.selectAllModels();
				});
		});

		batchButtonsRow.addButton((btn) => {
			btn.setButtonText(CONST.MODEL_BATCH_DESELECT_ALL).onClick(() => {
				this.deselectAllModels();
			});
		});

		// 模型列表容器
		this.batchModelsContainer = batchSection.createEl("div", {
			cls: "model-batch-list",
		});

		// 批量添加按钮
		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText(CONST.MODEL_BATCH_ADD)
				.setCta()
				.setDisabled(true)
				.onClick(async () => {
					await this.saveBatch();
				});
			this.batchAddButton = btn;
		});

		// 取消按钮
		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText(CONST.MODEL_MODAL_CANCEL).onClick(() => {
				this.close();
			});
		});
	}

	private async loadModelsForProvider(
		provider: ProviderProfile,
	): Promise<void> {
		if (!this.batchModelsContainer) return;

		// 生成新的请求 ID 并保存
		const currentRequestId = ++this.loadModelsRequestId;

		// 清空容器
		this.batchModelsContainer.empty();
		this.selectedModels.clear();
		this.availableModels = [];
		this.updateBatchButtonState();

		// 显示加载中
		const loadingEl = this.batchModelsContainer.createEl("p", {
			text: CONST.MODEL_BATCH_LOADING,
			cls: "setting-item-description",
		});

		try {
			// 检查是否支持批量导入
			if (!supportsBatchImport(provider.type)) {
				loadingEl.setText(CONST.MODEL_BATCH_UNSUPPORTED);
				return;
			}

			const models =
				await this.providerManager.getProviderModels(provider);

			// 检查是否是更新的请求，过期请求清理 DOM
			if (currentRequestId !== this.loadModelsRequestId) {
				loadingEl.remove();
				return;
			}

			// 移除加载提示
			loadingEl.remove();

			if (models.length === 0) {
				this.batchModelsContainer.createEl("p", {
					text: CONST.MODEL_BATCH_EMPTY,
					cls: "setting-item-description",
				});
				return;
			}

			// 过滤已存在的模型
			const existingModelIds = new Set(
				this.modelManager
					.getAllModels()
					.filter((m) => m.providerId === provider.id)
					.map((m) => m.modelId),
			);

			this.availableModels = models.filter(
				(m) => !existingModelIds.has(m.id),
			);

			if (this.availableModels.length === 0) {
				this.batchModelsContainer.createEl("p", {
					text: CONST.MODEL_BATCH_ALL_ADDED,
					cls: "setting-item-description",
				});
				return;
			}

			// 渲染模型列表
			this.renderModelList();
		} catch (error) {
			// 检查是否是过期的请求
			if (currentRequestId !== this.loadModelsRequestId) {
				return;
			}
			console.error("Failed to load models:", error);
			// 检查 loadingEl 是否还在 DOM 中（可能被竞态条件清除）
			if (loadingEl.parentNode) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				loadingEl.setText(
					`${CONST.MODEL_BATCH_ERROR}: ${errorMessage}`,
				);
			}
		}
	}

	private renderModelList(): void {
		if (!this.batchModelsContainer) return;

		// 清理旧的 checkbox 监听器
		this.checkboxListeners.forEach(({ element, listener }) => {
			element.removeEventListener("change", listener);
		});
		this.checkboxListeners = [];

		// 注意：batchModelsContainer 已经在 loadModelsForProvider 中被清空了
		// 这里只需直接渲染模型列表

		this.availableModels.forEach((model) => {
			const item = this.batchModelsContainer!.createEl("div", {
				cls: "model-batch-item",
			});

			const checkbox = item.createEl("input", {
				type: "checkbox",
				cls: "model-batch-checkbox",
			});
			// 使用 data-model-id 替代数组索引，更健壮
			checkbox.dataset.modelId = model.id;

			const listener = (e: Event) => {
				if ((e.target as HTMLInputElement).checked) {
					this.selectedModels.add(model.id);
				} else {
					this.selectedModels.delete(model.id);
				}
				this.updateBatchButtonState();
			};
			checkbox.addEventListener("change", listener);
			this.checkboxListeners.push({ element: checkbox, listener });

			item.createEl("span", {
				text: model.name,
				cls: "model-batch-name",
			});
		});
	}

	private selectAllModels(): void {
		this.availableModels.forEach((m) => this.selectedModels.add(m.id));
		this.updateCheckboxes();
		this.updateBatchButtonState();
	}

	private deselectAllModels(): void {
		this.selectedModels.clear();
		this.updateCheckboxes();
		this.updateBatchButtonState();
	}

	private updateCheckboxes(): void {
		if (!this.batchModelsContainer) return;

		const checkboxes = this.batchModelsContainer.querySelectorAll(
			".model-batch-checkbox",
		);

		// 使用 data-model-id 而非数组索引，更健壮
		checkboxes.forEach((checkboxEl) => {
			const checkbox = checkboxEl as HTMLInputElement;
			const modelId = checkbox.dataset.modelId;
			if (modelId) {
				checkbox.checked = this.selectedModels.has(modelId);
			}
		});
	}

	private updateBatchButtonState(): void {
		if (this.batchAddButton) {
			this.batchAddButton.setDisabled(this.selectedModels.size === 0);
		}
	}

	private async saveSingle(): Promise<void> {
		const providerId = this.providerDropdown.getValue();
		const name = this.nameInput.getValue().trim();
		const modelId = this.modelIdInput.getValue().trim();

		if (!providerId || !name || !modelId) {
			new Notice(
				CONST.NOTICE_VALIDATION_ERROR_PREFIX +
					CONST.MODEL_VALIDATION_EMPTY,
			);
			return;
		}

		try {
			await this.onSave([{ name, modelId, providerId }]);
			this.close();
		} catch (error) {
			console.error("Failed to add model:", error);
			new Notice(CONST.MODEL_SAVE_ERROR);
		}
	}

	private async saveBatch(): Promise<void> {
		if (!this.currentProvider || this.selectedModels.size === 0) return;

		const providerId = this.currentProvider.id;
		const modelsToAdd = this.availableModels
			.filter((m) => this.selectedModels.has(m.id))
			.map((m) => ({
				name: m.name,
				modelId: m.id,
				providerId,
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
		// 递增请求 ID 使进行中的请求失效
		this.loadModelsRequestId++;
		// 清理 checkbox 监听器
		this.checkboxListeners.forEach(({ element, listener }) => {
			element.removeEventListener("change", listener);
		});
		this.checkboxListeners = [];

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
		// Update managers with latest settings
		this.modelManager = new ModelManager(
			this.plugin.settings.models,
			this.plugin.settings.defaultModelId,
		);
		this.providerManager = new ProviderManager(
			this.plugin.settings.providers,
		);

		new Setting(containerEl)
			.setName(CONST.MODEL_SECTION_TITLE)
			.setHeading();

		const models = this.modelManager.getAllModels();
		const defaultModelId = this.modelManager.getDefaultModelId();

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
				if (model.id === defaultModelId) {
					desc += CONST.MODEL_DEFAULT_BADGE;
				}

				const setting = new Setting(containerEl)
					.setName(model.name)
					.setDesc(desc);

				setting.addToggle((toggle) => {
					toggle.setValue(model.enabled).onChange(async (value) => {
						this.modelManager.toggleModelEnabled(model.id);
						this.plugin.settings.models =
							this.modelManager.getAllModels();
						await this.plugin.saveSettings();
						onRefresh();
					});
				});

				if (model.enabled && model.id !== defaultModelId) {
					setting.addButton((btn) => {
						btn.setButtonText(
							CONST.MODEL_SET_DEFAULT_BUTTON,
						).onClick(async () => {
							this.modelManager.setDefaultModel(model.id);
							this.plugin.settings.defaultModelId =
								this.modelManager.getDefaultModelId();
							await this.plugin.saveSettings();
							onRefresh();
						});
					});
				}

				setting.addButton((btn) => {
					btn.setButtonText(CONST.MODEL_DELETE_BUTTON)
						.setWarning()
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
			});
		}

		const hasProviders = this.providerManager.getAllProviders().length > 0;
		new Setting(containerEl).addButton((btn) => {
			btn.setButtonText(CONST.MODEL_ADD_BUTTON)
				.setCta()
				.setDisabled(!hasProviders)
				.onClick(async () => {
					new AddModelModal(
						this.plugin.app,
						this.plugin,
						async (newModels) => {
							// 批量添加模型，带错误处理
							let successCount = 0;
							let failedCount = 0;
							for (const model of newModels) {
								try {
									this.modelManager.addModel(
										model.name,
										model.modelId,
										model.providerId,
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

							// 显示添加结果
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
	}
}
