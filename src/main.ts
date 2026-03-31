import { Plugin, Notice } from "obsidian";
import { AmanuensisServer } from "./server";
import {
	DEFAULT_SETTINGS,
	AmanuensisPluginSettings,
	AmanuensisSettingTab,
} from "./settings";
import { validatePort, getPortErrorMessage } from "./utils/port-validator";

// Remember to rename these classes and interfaces!

export default class AmanuensisPlugin extends Plugin {
	settings: AmanuensisPluginSettings;

	server: AmanuensisServer | null = null;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AmanuensisSettingTab(this.app, this));

		// Start the server
		const port = validatePort(this.settings.port);
		if (port === null) {
			throw new Error(getPortErrorMessage(this.settings.port));
		}

		this.server = await AmanuensisServer.create({
			port: port,
		});

		await this.server.start();
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	async onunload() {
		if (this.server) {
			await this.server.stop();
		}
	}

	async restartServer(): Promise<void> {
		if (this.server) {
			const port = validatePort(this.settings.port);
			if (port === null) {
				new Notice(getPortErrorMessage(this.settings.port));
				return;
			}
			await this.server.stop();
			await this.server.start(port);
			new Notice(`服务器已重启，端口: ${port}`);
		}
	}

	async loadSettings() {
		const loadedData = ((await this.loadData()) ||
			{}) as Partial<AmanuensisPluginSettings>;
		this.settings = {
			...DEFAULT_SETTINGS,
			...loadedData,
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
