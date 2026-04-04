import { Plugin } from "obsidian";
import { AI_VIEW_TYPE } from "./ai-view";
import { AI_TEXTS } from "./ai-const";

export function registerAIRibbonIcon(plugin: Plugin): void {
	// 使用内置 sparkles 图标
	plugin.addRibbonIcon("sparkles", AI_TEXTS.RIBBON_TOOLTIP, () => {
		const leaves = plugin.app.workspace.getLeavesOfType(AI_VIEW_TYPE);
		if (leaves.length > 0) {
			for (const leaf of leaves) {
				leaf.detach();
			}
		} else {
			void plugin.app.workspace.getRightLeaf(false)?.setViewState({
				type: AI_VIEW_TYPE,
				active: true,
			});
		}
	});
}
