import { Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	AmanuensisPluginSettings,
	AmanuensisSettingTab,
} from "./settings";

// Remember to rename these classes and interfaces!

export default class AmanuensisPlugin extends Plugin {
	settings: AmanuensisPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status bar text");
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AmanuensisSettingTab(this.app, this));
	}

	onunload() {}

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
