import { App, PluginSettingTab, Modal, Setting } from "obsidian";

import type AmanuensisPlugin from "./main";
import type { AmanuensisPluginSettings } from "./types/settings";
import { DEFAULT_SETTINGS } from "./types/settings";
import { BasicConfigSection } from "./settings/sections/basic-config-section";
import { ProviderSection } from "./settings/sections/provider-section";
import { ModelSection } from "./settings/sections/model-section";
import * as CONST from "./const";

export { DEFAULT_SETTINGS };

export type { AmanuensisPluginSettings };

export class AmanuensisSettingTab extends PluginSettingTab {
	plugin: AmanuensisPlugin;
	private basicConfigSection: BasicConfigSection;
	private providerSection: ProviderSection;
	private modelSection: ModelSection;

	constructor(app: App, plugin: AmanuensisPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.basicConfigSection = new BasicConfigSection(plugin);
		this.providerSection = new ProviderSection(plugin);
		this.modelSection = new ModelSection(plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// 基础配置
		this.basicConfigSection.display(containerEl);

		// Provider 管理
		this.providerSection.display(containerEl, () => this.display());

		// Model 管理
		this.modelSection.display(containerEl, () => this.display());
	}
}

export class ConfirmModal extends Modal {
	message: string;
	onConfirm: () => void | Promise<void>;

	constructor(
		app: App,
		message: string,
		onConfirm: () => void | Promise<void>,
	) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("p", {
			text: this.message,
			cls: "setting-item-description",
		});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(CONST.CONFIRM_MODAL_CANCEL).onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn.setButtonText(CONST.CONFIRM_MODAL_CONFIRM)
					.setWarning()
					.onClick(async () => {
						this.close();
						await this.onConfirm();
					});
			});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
