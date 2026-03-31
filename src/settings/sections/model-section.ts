import {
	Setting,
	Modal,
	DropdownComponent,
	TextComponent,
	Notice,
	App,
} from "obsidian";
import type AmanuensisPlugin from "../../main";
import { ModelManager } from "../model-manager";
import { ProviderManager } from "../provider-manager";
import * as CONST from "../../const";
import { ConfirmModal } from "../../settings";

class AddModelModal extends Modal {
	plugin: AmanuensisPlugin;
	onSave: (model: {
		name: string;
		modelId: string;
		providerId: string;
	}) => Promise<void>;

	providerDropdown: DropdownComponent;
	nameInput: TextComponent;
	modelIdInput: TextComponent;
	providerManager: ProviderManager;

	constructor(
		app: App,
		plugin: AmanuensisPlugin,
		onSave: (model: {
			name: string;
			modelId: string;
			providerId: string;
		}) => void | Promise<void>,
	) {
		super(app);
		this.plugin = plugin;
		this.onSave = async (model: {
			name: string;
			modelId: string;
			providerId: string;
		}) => {
			const result = onSave(model);
			if (result instanceof Promise) {
				await result;
			}
		};
		this.providerManager = new ProviderManager(plugin.settings.providers);
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
			});

		new Setting(contentEl)
			.setName(CONST.MODEL_NAME_LABEL)
			.setDesc(CONST.MODEL_NAME_DESC)
			.addText((text) => {
				this.nameInput = text;
				text.setPlaceholder(CONST.MODEL_NAME_PLACEHOLDER);
			});

		new Setting(contentEl)
			.setName(CONST.MODEL_ID_LABEL)
			.setDesc(CONST.MODEL_ID_DESC)
			.addText((text) => {
				this.modelIdInput = text;
				text.setPlaceholder(CONST.MODEL_ID_PLACEHOLDER);
			});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(CONST.MODEL_MODAL_CANCEL).onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn.setButtonText(CONST.MODEL_MODAL_ADD)
					.setCta()
					.onClick(async () => {
						await this.save();
					});
			});
	}

	async save(): Promise<void> {
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
			await this.onSave({ name, modelId, providerId });
			this.close();
		} catch (error) {
			console.error("Failed to add model:", error);
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
						async (newModel) => {
							this.modelManager.addModel(
								newModel.name,
								newModel.modelId,
								newModel.providerId,
							);
							this.plugin.settings.models =
								this.modelManager.getAllModels();
							await this.plugin.saveSettings();
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
