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

class ProviderModal extends Modal {
	plugin: AmanuensisPlugin;
	provider: ProviderProfile | null;
	onSave: (provider: ProviderProfile) => Promise<void>;

	nameInput: TextComponent;
	typeDropdown: DropdownComponent;
	baseUrlInput: TextComponent;
	apiKeyInput: TextComponent;

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
				dropdown.setValue(this.provider?.type || "openai");
			});

		new Setting(contentEl)
			.setName(CONST.PROVIDER_BASEURL_LABEL)
			.setDesc(CONST.PROVIDER_BASEURL_DESC)
			.addText((text) => {
				this.baseUrlInput = text;
				text.setPlaceholder(
					CONST.PROVIDER_BASEURL_PLACEHOLDER,
				).setValue(this.provider?.baseUrl || "");
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
			});

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

		new Setting(containerEl).addButton((btn) => {
			btn.setButtonText(CONST.PROVIDER_ADD_BUTTON)
				.setCta()
				.onClick(async () => {
					new ProviderModal(
						this.plugin.app,
						this.plugin,
						null,
						async (newProvider) => {
							const { type, name, baseUrl, apiKey } = newProvider;
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
	}
}
