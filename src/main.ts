import { Plugin } from "obsidian";
import { AmanuensisServer } from "./server";
import {
	DEFAULT_SETTINGS,
	AmanuensisPluginSettings,
	AmanuensisSettingTab,
} from "./settings";

// Remember to rename these classes and interfaces!

export default class AmanuensisPlugin extends Plugin {
	settings: AmanuensisPluginSettings;

	server: AmanuensisServer | null = null;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AmanuensisSettingTab(this.app, this));

		// Start the server
		this.server = await AmanuensisServer.create({
			port: +this.settings.port,
		});

		await this.server.start();
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	async onunload() {
		if (this.server) {
			await this.server.stop();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<AmanuensisPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
