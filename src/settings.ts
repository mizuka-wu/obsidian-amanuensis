import { App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_PORT as DEFAULT_SERVER_PORT } from "./server";

import AmanuensisPlugin from "./main";
export interface AmanuensisPluginSettings {
	port: string;
}

export const DEFAULT_SETTINGS: AmanuensisPluginSettings = {
	port: DEFAULT_SERVER_PORT + "",
};

export class AmanuensisSettingTab extends PluginSettingTab {
	plugin: AmanuensisPlugin;

	constructor(app: App, plugin: AmanuensisPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		/**
		 * 端口号
		 */
		new Setting(containerEl)
			.setName("端口号")
			.setDesc("服务器端口号")
			.addText((text) =>
				text
					.setPlaceholder("7861")
					.setValue(this.plugin.settings.port)
					.onChange(async (value) => {
						this.plugin.settings.port = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
