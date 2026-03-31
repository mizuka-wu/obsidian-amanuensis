import { Setting } from "obsidian";
import type AmanuensisPlugin from "../../main";
import * as CONST from "../../const";

export class BasicConfigSection {
	private plugin: AmanuensisPlugin;

	constructor(plugin: AmanuensisPlugin) {
		this.plugin = plugin;
	}

	display(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(CONST.BASIC_CONFIG_SECTION_TITLE)
			.setHeading();

		new Setting(containerEl)
			.setName(CONST.BASIC_CONFIG_PORT_LABEL)
			.setDesc(CONST.BASIC_CONFIG_PORT_DESC)
			.addText((text) =>
				text
					.setPlaceholder(CONST.BASIC_CONFIG_PORT_PLACEHOLDER)
					.setValue(this.plugin.settings.port)
					.onChange(async (value) => {
						const oldPort = this.plugin.settings.port;
						this.plugin.settings.port = value;
						await this.plugin.saveSettings();
						// 端口变更时重启服务器
						if (oldPort !== value) {
							await this.plugin.restartServer();
						}
					}),
			);
	}
}
