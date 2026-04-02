import {
	Setting,
	Modal,
	TextComponent,
	DropdownComponent,
	Notice,
	App,
} from "obsidian";
import type AmanuensisPlugin from "../../main";
import { ProviderManager } from "../provider-manager";
import type { ProviderProfile, ProviderType } from "../../types/settings";
import { generateUUID } from "../../utils/uuid";
import * as CONST from "../../const";
import { ConfirmModal } from "../../settings";
import { getProviderConfig } from "../../providers";

class ProviderModal extends Modal {
	plugin: AmanuensisPlugin;
	provider: ProviderProfile | null;
	onSave: (provider: ProviderProfile) => Promise<void>;

	nameInput: TextComponent;
	typeDropdown: DropdownComponent;
	baseUrlInput: TextComponent;
	apiKeyInput: TextComponent;

	// 缓存各类型的输入值
	private inputCache: Record<
		ProviderType,
		{ name: string; baseUrl: string; apiKey: string }
	> = {
		openai: { name: "", baseUrl: "", apiKey: "" },
		anthropic: { name: "", baseUrl: "", apiKey: "" },
		ollama: { name: "", baseUrl: "", apiKey: "" },
		lmstudio: { name: "", baseUrl: "", apiKey: "" },
		custom: { name: "", baseUrl: "", apiKey: "" },
	};

	// 记录用户是否主动输入过
	private userInputted: Record<
		ProviderType,
		{ name: boolean; baseUrl: boolean }
	> = {
		openai: { name: false, baseUrl: false },
		anthropic: { name: false, baseUrl: false },
		ollama: { name: false, baseUrl: false },
		lmstudio: { name: false, baseUrl: false },
		custom: { name: false, baseUrl: false },
	};

	constructor(
		app: App,
		plugin: AmanuensisPlugin,
		provider: ProviderProfile | null,
		onSave: (provider: ProviderProfile) => void | Promise<void>,
	) {
		super(app);
		this.plugin = plugin;
		this.provider = provider;
		this.onSave = async (provider: ProviderProfile) => {
			const result = onSave(provider);
			if (result instanceof Promise) {
				await result;
			}
		};
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText(
			this.provider
				? CONST.PROVIDER_MODAL_TITLE_EDIT
				: CONST.PROVIDER_MODAL_TITLE_ADD,
		);

		new Setting(contentEl)
			.setName(CONST.PROVIDER_NAME_LABEL)
			.setDesc(CONST.PROVIDER_NAME_DESC)
			.addText((text) => {
				this.nameInput = text;
				text.setPlaceholder(CONST.PROVIDER_NAME_PLACEHOLDER).setValue(
					this.provider?.name || "",
				);
				text.inputEl.addClass("provider-input");
				text.onChange((value) => {
					const currentType =
						this.typeDropdown.getValue() as ProviderType;
					this.inputCache[currentType].name = value;
					if (value.trim()) {
						this.userInputted[currentType].name = true;
					}
				});
			});

		new Setting(contentEl)
			.setName(CONST.PROVIDER_TYPE_LABEL)
			.setDesc(CONST.PROVIDER_TYPE_DESC)
			.addDropdown((dropdown) => {
				this.typeDropdown = dropdown;
				Object.entries(CONST.PROVIDER_TYPE_OPTIONS).forEach(
					([key, value]) => {
						dropdown.addOption(key, value);
					},
				);
				const currentType = this.provider?.type || "openai";
				dropdown.setValue(currentType);
				dropdown.onChange((value) => {
					this.onTypeChange(value as ProviderType);
				});
			});

		new Setting(contentEl)
			.setName(CONST.PROVIDER_BASEURL_LABEL)
			.setDesc(CONST.PROVIDER_BASEURL_DESC)
			.addText((text) => {
				this.baseUrlInput = text;
				text.setPlaceholder(
					CONST.PROVIDER_BASEURL_PLACEHOLDER,
				).setValue(this.provider?.baseUrl || "");
				text.inputEl.addClass("provider-input");
				text.onChange((value) => {
					const currentType =
						this.typeDropdown.getValue() as ProviderType;
					this.inputCache[currentType].baseUrl = value;
					if (value.trim()) {
						this.userInputted[currentType].baseUrl = true;
					}
				});
			});

		new Setting(contentEl)
			.setName(CONST.PROVIDER_APIKEY_LABEL)
			.setDesc(CONST.PROVIDER_APIKEY_DESC)
			.addText((text) => {
				this.apiKeyInput = text;
				text.setPlaceholder(CONST.PROVIDER_APIKEY_PLACEHOLDER).setValue(
					this.provider?.apiKey || "",
				);
				text.inputEl.type = "password";
				text.inputEl.addClass("provider-input");
				text.onChange((value) => {
					const currentType =
						this.typeDropdown.getValue() as ProviderType;
					this.inputCache[currentType].apiKey = value;
				});
			});

		// 如果是新增 Provider，自动填充默认值
		if (!this.provider) {
			const defaultType = "openai" as ProviderType;
			this.onTypeChange(defaultType);
		}

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(CONST.PROVIDER_MODAL_CANCEL).onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn.setButtonText(CONST.PROVIDER_MODAL_SAVE)
					.setCta()
					.onClick(async () => {
						await this.save();
					});
			});
	}

	private onTypeChange(type: ProviderType): void {
		const defaults = getProviderConfig(type);
		const cache = this.inputCache[type];
		const inputted = this.userInputted[type];

		// 恢复或填充名称
		if (cache.name) {
			// 如果有缓存值，恢复缓存
			this.nameInput.setValue(cache.name);
		} else if (!inputted.name) {
			// 如果用户未输入过，填充默认值
			this.nameInput.setValue(defaults.defaultName);
		}

		// 恢复或填充 Base URL
		if (cache.baseUrl) {
			// 如果有缓存值，恢复缓存
			this.baseUrlInput.setValue(cache.baseUrl);
		} else if (!inputted.baseUrl) {
			// 如果用户未输入过，填充默认值
			this.baseUrlInput.setValue(defaults.defaultBaseUrl);
		}

		// 恢复或清空 API Key
		if (cache.apiKey) {
			this.apiKeyInput.setValue(cache.apiKey);
		} else if (!defaults.requiresApiKey) {
			this.apiKeyInput.setValue("");
		}
	}

	async save(): Promise<void> {
		const name = this.nameInput.getValue().trim();
		const type = this.typeDropdown.getValue() as ProviderType;
		const baseUrl = this.baseUrlInput.getValue().trim();
		const apiKey = this.apiKeyInput.getValue().trim();

		if (!name || !baseUrl) {
			new Notice(
				CONST.NOTICE_VALIDATION_ERROR_PREFIX +
					CONST.PROVIDER_VALIDATION_EMPTY,
			);
			return;
		}

		// Validate URL format
		try {
			new URL(baseUrl);
		} catch {
			new Notice(
				CONST.NOTICE_VALIDATION_ERROR_PREFIX +
					CONST.PROVIDER_VALIDATION_URL_INVALID,
			);
			return;
		}

		const provider: ProviderProfile = {
			id: this.provider?.id || generateUUID(),
			type,
			name,
			baseUrl,
			apiKey,
		};

		try {
			await this.onSave(provider);
			this.close();
		} catch (error) {
			console.error("Failed to save provider:", error);
			new Notice(CONST.PROVIDER_SAVE_ERROR);
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ProviderSection {
	private plugin: AmanuensisPlugin;
	private providerManager: ProviderManager;

	constructor(plugin: AmanuensisPlugin) {
		this.plugin = plugin;
		this.providerManager = new ProviderManager(plugin.settings.providers);
	}

	display(containerEl: HTMLElement, onRefresh: () => void): void {
		// Update manager with latest settings
		this.providerManager = new ProviderManager(
			this.plugin.settings.providers,
		);

		new Setting(containerEl)
			.setName(CONST.PROVIDER_SECTION_TITLE)
			.setHeading();

		const providers = this.providerManager.getAllProviders();

		// 顶部添加按钮带数量描述
		new Setting(containerEl)
			.setDesc(`你目前已经添加了 ${providers.length} 个模型源`)
			.addExtraButton((btn) => {
				btn.setIcon("circle-plus")
					.setTooltip("添加模型源")
					.onClick(async () => {
						new ProviderModal(
							this.plugin.app,
							this.plugin,
							null,
							async (newProvider) => {
								const { type, name, baseUrl, apiKey } =
									newProvider;
								this.providerManager.createProvider(
									type,
									name,
									baseUrl,
									apiKey,
								);
								this.plugin.settings.providers =
									this.providerManager.getProviders();
								await this.plugin.saveSettings();
								onRefresh();
							},
						).open();
					});
			});

		if (providers.length === 0) {
			containerEl.createEl("p", {
				text: CONST.PROVIDER_EMPTY_TEXT,
				cls: "setting-item-description",
			});
		} else {
			providers.forEach((provider) => {
				const setting = new Setting(containerEl)
					.setName(provider.name)
					.setDesc(`类型: ${provider.type}`);

				setting.addButton((btn) => {
					btn.setButtonText(CONST.PROVIDER_MANAGE_BUTTON).onClick(
						async () => {
							new ProviderModal(
								this.plugin.app,
								this.plugin,
								provider,
								async (updatedProvider) => {
									this.providerManager.updateProvider(
										updatedProvider.id,
										updatedProvider,
									);
									this.plugin.settings.providers =
										this.providerManager.getProviders();
									await this.plugin.saveSettings();
									onRefresh();
								},
							).open();
						},
					);
				});

				setting.addButton((btn) => {
					btn.setButtonText(CONST.PROVIDER_DELETE_BUTTON)
						.setWarning()
						.onClick(async () => {
							new ConfirmModal(
								this.plugin.app,
								CONST.PROVIDER_DELETE_CONFIRM(provider.name),
								async () => {
									this.providerManager.deleteProvider(
										provider.id,
									);
									this.plugin.settings.providers =
										this.providerManager.getProviders();
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
