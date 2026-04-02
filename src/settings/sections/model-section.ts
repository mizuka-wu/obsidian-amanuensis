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
	id: string; // 临时ID，用于列表管理
	name: string;
	modelId: string;
	providerId: string;
	providerName: string;
	description: string; // 模型功能描述
	supportsToolUse: boolean; // 是否支持 tool use
}

// 手动输入模型时询问名称的弹窗
class ModelNameInputModal extends Modal {
	modelId: string;
	onConfirm: (
		name: string,
		description: string,
		supportsToolUse: boolean,
	) => void;
	nameInput: HTMLInputElement | null = null;
	descriptionInput: HTMLInputElement | null = null;
	supportsToolUseInput: HTMLInputElement | null = null;

	constructor(
		app: App,
		modelId: string,
		onConfirm: (
			name: string,
			description: string,
			supportsToolUse: boolean,
		) => void,
	) {
		super(app);
		this.modelId = modelId;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText("输入模型名称");

		// 显示模型 ID
		contentEl.createEl("p", {
			text: `模型 ID: ${this.modelId}`,
			cls: "setting-item-description",
		});

		// 名称输入
		const nameContainer = contentEl.createEl("div", {
			cls: "model-name-input-container",
		});
		this.nameInput = nameContainer.createEl("input", {
			type: "text",
			cls: "model-name-input",
			placeholder: "输入模型显示名称",
		});

		// 功能描述输入
		const descContainer = contentEl.createEl("div", {
			cls: "model-name-input-container",
		});
		descContainer.createEl("label", {
			text: "功能描述（可选）:",
			cls: "setting-item-description",
		});
		this.descriptionInput = descContainer.createEl("input", {
			type: "text",
			cls: "model-name-input",
			placeholder: "描述此模型的功能，如：适合代码补全、长文本生成等",
		});

		// tool use 支持
		const toolUseContainer = contentEl.createEl("div", {
			cls: "model-name-input-container",
		});
		const toolUseLabel = toolUseContainer.createEl("label", {
			cls: "checkbox-container",
		});
		this.supportsToolUseInput = toolUseLabel.createEl("input", {
			type: "checkbox",
		});
		toolUseLabel.appendText(" 支持 tool use（函数调用）");

		// 默认填入 modelId
		this.nameInput.value = this.modelId;
		this.nameInput.focus();

		// 按钮行
		const buttonRow = contentEl.createEl("div", {
			cls: "modal-button-row",
		});

		const cancelBtn = buttonRow.createEl("button", {
			text: "取消",
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
		});

		const confirmBtn = buttonRow.createEl("button", {
			cls: "mod-cta",
			text: "确定",
		});
		confirmBtn.addEventListener("click", () => {
			const name = this.nameInput?.value.trim();
			const description = this.descriptionInput?.value.trim() || "";
			const supportsToolUse = this.supportsToolUseInput?.checked || false;
			if (name) {
				this.onConfirm(name, description, supportsToolUse);
				this.close();
			}
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// 模型选择下拉/弹窗组件
class ModelSelectorModal extends Modal {
	plugin: AmanuensisPlugin;
	onSelect: (model: FetchedModel) => void;
	provider: ProviderProfile;
	providerManager: ProviderManager;
	modelManager: ModelManager;
	existingModelIds: Set<string>;

	availableModels: FetchedModel[] = [];
	modelsContainer: HTMLElement | null = null;
	searchInput: HTMLInputElement | null = null;

	private loadModelsRequestId: number = 0;

	constructor(
		app: App,
		plugin: AmanuensisPlugin,
		provider: ProviderProfile,
		existingModelIds: Set<string>,
		onSelect: (model: FetchedModel) => void,
	) {
		super(app);
		this.plugin = plugin;
		this.provider = provider;
		this.existingModelIds = existingModelIds;
		this.onSelect = onSelect;
		this.providerManager = new ProviderManager(plugin.settings.providers);
		this.modelManager = new ModelManager(
			plugin.settings.models,
			plugin.settings.defaultModelId,
		);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("model-selector-modal");

		this.titleEl.setText(`选择模型 - ${this.provider.name}`);

		// 搜索框
		const searchContainer = contentEl.createEl("div", {
			cls: "model-selector-search",
		});
		this.searchInput = searchContainer.createEl("input", {
			type: "text",
			cls: "model-selector-input",
			placeholder: "搜索模型...",
		});

		// 模型列表容器
		this.modelsContainer = contentEl.createEl("div", {
			cls: "model-selector-list",
		});

		// 加载模型
		void this.loadModels();

		// 搜索功能
		this.searchInput.addEventListener("input", () => {
			this.filterModels();
		});
	}

	private async loadModels(): Promise<void> {
		if (!this.modelsContainer) return;

		const currentRequestId = ++this.loadModelsRequestId;

		// 显示加载中
		this.modelsContainer.empty();
		const loadingEl = this.modelsContainer.createEl("div", {
			cls: "model-selector-loading",
			text: "加载中...",
		});

		try {
			if (!supportsBatchImport(this.provider.type)) {
				loadingEl.setText("此来源不支持获取模型列表");
				return;
			}

			const models = await this.providerManager.getProviderModels(
				this.provider,
			);

			if (currentRequestId !== this.loadModelsRequestId) return;

			// 过滤已存在的模型
			this.availableModels = models.filter(
				(m) => !this.existingModelIds.has(m.id),
			);

			loadingEl.remove();

			if (this.availableModels.length === 0) {
				this.modelsContainer.createEl("div", {
					cls: "model-selector-empty",
					text: "没有可用模型",
				});
				return;
			}

			this.renderModelList();
		} catch (error) {
			if (currentRequestId !== this.loadModelsRequestId) return;
			loadingEl.setText(
				`加载失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}

	private renderModelList(): void {
		if (!this.modelsContainer) return;
		this.modelsContainer.empty();

		this.availableModels.forEach((model) => {
			const item = this.modelsContainer!.createEl("div", {
				cls: "model-selector-item",
			});

			item.createEl("span", {
				text: model.name,
				cls: "model-selector-name",
			});

			item.createEl("span", {
				text: model.id,
				cls: "model-selector-id",
			});

			item.addEventListener("click", () => {
				this.onSelect(model);
				this.close();
			});
		});
	}

	private filterModels(): void {
		if (!this.searchInput || !this.modelsContainer) return;

		const query = this.searchInput.value.toLowerCase();
		const items = this.modelsContainer.querySelectorAll(
			".model-selector-item",
		);

		items.forEach((item) => {
			const nameEl = item.querySelector(".model-selector-name");
			const idEl = item.querySelector(".model-selector-id");
			const text =
				(nameEl?.textContent || "") + (idEl?.textContent || "");
			(item as HTMLElement).style.display = text
				.toLowerCase()
				.includes(query)
				? ""
				: "none";
		});
	}

	onClose(): void {
		this.loadModelsRequestId++;
		const { contentEl } = this;
		contentEl.empty();
	}
}

class AddModelModal extends Modal {
	plugin: AmanuensisPlugin;
	onSave: (
		models: { name: string; modelId: string; providerId: string }[],
	) => Promise<void>;

	providerManager: ProviderManager;
	modelManager: ModelManager;

	// 待添加模型列表
	pendingModels: PendingModel[] = [];
	pendingListContainer: HTMLElement | null = null;

	// 当前选择的provider和模型
	currentProvider: ProviderProfile | null = null;
	selectedModel: FetchedModel | null = null;

	// 输入框和下拉列表
	modelInputContainer: HTMLElement | null = null;
	modelInput: HTMLInputElement | null = null;
	modelDropdown: HTMLElement | null = null;
	addButton: HTMLButtonElement | null = null;

	// 可用的模型列表
	availableModels: FetchedModel[] = [];
	private loadModelsRequestId: number = 0;

	confirmButton: ButtonComponent | null = null;

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

		// 待添加模型列表区域（顶部）
		this.pendingListContainer = contentEl.createEl("div", {
			cls: "pending-models-section",
		});

		// 初始渲染空列表提示
		this.renderPendingList();

		// 分割线
		contentEl.createEl("hr", { cls: "model-add-divider" });

		// 底部添加区域 - 水平布局
		const addSection = contentEl.createEl("div", {
			cls: "model-add-section",
		});

		// Provider 选择器
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

		// 选择第一个 provider
		if (providers.length > 0) {
			this.currentProvider = providers[0] ?? null;
		}

		providerSelect.addEventListener("change", () => {
			const providerId = providerSelect.value;
			const provider = this.providerManager.getProviderById(providerId);
			this.currentProvider = provider ?? null;
			// 切换 provider 时清空当前选择的模型
			this.selectedModel = null;
			if (this.modelInput) {
				this.modelInput.value = "";
				this.modelInput.placeholder = "点击选择或输入 id";
			}
			this.updateAddButton();
		});

		// 模型选择输入框（带 autocomplete 下拉）
		this.modelInputContainer = addSection.createEl("div", {
			cls: "model-add-input-container",
		});

		// 输入框
		this.modelInput = this.modelInputContainer.createEl("input", {
			type: "text",
			cls: "model-add-input",
			placeholder: "点击选择或输入 id",
		});

		// 下拉列表容器（初始隐藏）
		this.modelDropdown = this.modelInputContainer.createEl("div", {
			cls: "model-autocomplete-dropdown is-hidden",
		});

		// 监听输入框焦点
		this.modelInput.addEventListener("focus", () => {
			if (!this.currentProvider) {
				new Notice("请先选择 provider");
				this.modelInput?.blur();
				return;
			}
			void this.loadAndShowModels();
		});

		// 监听输入变化（过滤）
		this.modelInput.addEventListener("input", () => {
			this.updateAddButton();
			this.filterModelDropdown();
		});

		// 点击外部关闭下拉
		document.addEventListener("click", (e) => {
			if (
				this.modelInputContainer &&
				!this.modelInputContainer.contains(e.target as Node)
			) {
				this.hideModelDropdown();
			}
		});

		// 添加按钮
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

			// 如果是从选择器选择的模型
			if (this.selectedModel && this.selectedModel.id === inputValue) {
				this.addPendingModel(
					this.selectedModel.name,
					this.selectedModel.id,
					"",
					false,
				);
			} else {
				// 手动输入的情况，直接用 ID 作为名称
				this.addPendingModel(inputValue, inputValue, "", false);
			}

			// 清空选择
			this.selectedModel = null;
			this.modelInput.value = "";
			this.updateAddButton();
		});

		// 底部按钮区域 - 使用 Setting 类，与 Provider 编辑保持一致
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
			// 有输入内容就启用添加按钮
			this.addButton.disabled = !this.modelInput.value.trim();
		}
	}

	private async loadAndShowModels(): Promise<void> {
		if (!this.modelDropdown || !this.currentProvider) {
			console.debug(
				"[loadAndShowModels] modelDropdown or currentProvider is null",
			);
			return;
		}

		console.debug(
			"[loadAndShowModels] 开始加载模型列表，provider:",
			this.currentProvider.name,
			"type:",
			this.currentProvider.type,
		);

		// 显示加载中
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
			console.debug(
				"[loadAndShowModels] supportsBatchImport:",
				supportsBatch,
				"type:",
				this.currentProvider.type,
			);

			if (!supportsBatch) {
				console.debug("[loadAndShowModels] 此来源不支持批量导入");
				this.modelDropdown.empty();
				this.modelDropdown.createEl("div", {
					cls: "model-autocomplete-empty",
					text: "此来源不支持获取模型列表",
				});
				return;
			}

			console.debug("[loadAndShowModels] 调用 getProviderModels...");
			const models = await this.providerManager.getProviderModels(
				this.currentProvider,
			);
			console.debug(
				"[loadAndShowModels] getProviderModels 返回:",
				models.length,
				"个模型",
				models,
			);

			if (currentRequestId !== this.loadModelsRequestId) {
				console.debug("[loadAndShowModels] 请求已过期，忽略结果");
				return;
			}

			// 过滤已存在的模型
			const allExistingModels = this.modelManager.getAllModels();
			const existingInManager = allExistingModels
				.filter((m) => m.providerId === this.currentProvider!.id)
				.map((m) => m.modelId);
			const existingPending = this.pendingModels
				.filter((m) => m.providerId === this.currentProvider!.id)
				.map((m) => m.modelId);

			console.debug(
				"[loadAndShowModels] 已存在模型 - manager:",
				existingInManager,
				"pending:",
				existingPending,
			);

			const existingIds = new Set([
				...existingInManager,
				...existingPending,
			]);
			console.debug(
				"[loadAndShowModels] 过滤ID集合:",
				Array.from(existingIds),
			);

			this.availableModels = models.filter((m) => {
				const isExisting = existingIds.has(m.id);
				if (isExisting) {
					console.debug(
						"[loadAndShowModels] 过滤掉已存在模型:",
						m.id,
					);
				}
				return !isExisting;
			});

			console.debug(
				"[loadAndShowModels] 过滤后可用模型:",
				this.availableModels.length,
				"个",
				this.availableModels,
			);

			this.renderModelDropdown();
		} catch (error) {
			if (currentRequestId !== this.loadModelsRequestId) return;
			console.error("[loadAndShowModels] 加载失败:", error);
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

		// 计算并设置下拉框位置
		const inputRect = this.modelInput.getBoundingClientRect();
		const dropdownHeight = 200; // 最大高度
		const spaceBelow = window.innerHeight - inputRect.bottom;
		const spaceAbove = inputRect.top;

		// 如果下方空间不够，显示在上方
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
				// 直接添加到列表，不弹窗
				this.addPendingModel(model.name, model.id, "", false);
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
		description: string = "",
		supportsToolUse: boolean = false,
	): void {
		if (!this.currentProvider) return;

		// 检查是否已存在
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
			description,
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

			// 名称行（包含 tool use 标记）
			const nameRow = infoContainer.createEl("div", {
				cls: "pending-model-name-row",
			});
			nameRow.createEl("span", {
				text: model.name,
				cls: "pending-model-name",
			});
			if (model.supportsToolUse) {
				nameRow.createEl("span", {
					text: "🔧",
					cls: "pending-model-tool-badge",
					title: "支持 tool use",
				});
			}

			// 描述
			if (model.description) {
				infoContainer.createEl("div", {
					text: model.description,
					cls: "pending-model-description",
				});
			}

			// 模型 ID
			infoContainer.createEl("span", {
				text: model.modelId,
				cls: "pending-model-id",
			});

			const actions = item.createEl("div", {
				cls: "pending-model-actions",
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
		// Update managers with latest settings
		this.modelManager = new ModelManager(
			this.plugin.settings.models,
			this.plugin.settings.defaultModelId,
		);
		this.providerManager = new ProviderManager(
			this.plugin.settings.providers,
		);

		const hasProviders = this.providerManager.getAllProviders().length > 0;

		// 如果没有模型源，整个模型 section 不显示
		if (!hasProviders) {
			return;
		}

		new Setting(containerEl)
			.setName(CONST.MODEL_SECTION_TITLE)
			.setHeading();

		const models = this.modelManager.getAllModels();
		const defaultModelId = this.modelManager.getDefaultModelId();

		// 顶部添加按钮带数量描述
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
	}
}
