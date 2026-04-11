/**
 * Ribbon 图标注册模块
 * 管理 Obsidian 侧边栏的 AI 助手图标
 */

import { Plugin } from "obsidian";
import { UI_CONFIG, UI_TEXTS } from "./constants";

/**
 * 注册 AI 助手 ribbon 图标
 * 点击图标可以切换 AI 助手视图的显示/隐藏
 */
export function registerAIRibbon(plugin: Plugin): void {
	plugin.addRibbonIcon(
		UI_CONFIG.VIEW_ICON,
		UI_TEXTS.RIBBON_TOOLTIP,
		() => {
			const leaves = plugin.app.workspace.getLeavesOfType(
				UI_CONFIG.VIEW_TYPE,
			);
			if (leaves.length > 0) {
				// 如果视图已打开，关闭所有实例
				for (const leaf of leaves) {
					leaf.detach();
				}
			} else {
				// 否则在右侧面板打开新视图
				void plugin.app.workspace.getRightLeaf(false)?.setViewState({
					type: UI_CONFIG.VIEW_TYPE,
					active: true,
				});
			}
		},
	);
}
