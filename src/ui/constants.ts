/**
 * UI 模块常量定义
 * 包含所有 UI 相关的文本、图标和配置
 */

export const UI_TEXTS = {
	// Ribbon icon
	RIBBON_TOOLTIP: "切换 AI 助手",

	// View
	VIEW_TITLE: "AI 助手",
	VIEW_DISPLAY_TEXT: "AI 助手",

	// Empty state
	EMPTY_STATE_ICON: "✨",
	EMPTY_STATE_TITLE: "开始与 AI 对话",
	EMPTY_STATE_HINT: "在下方输入消息开始",

	// Input
	INPUT_PLACEHOLDER: "输入你的消息...",
	SEND_BUTTON_TITLE: "发送消息 (Enter)",
	SEND_BUTTON_TEXT: "➤",

	// Message actions
	COPY_BUTTON_TITLE: "复制消息",
	COPY_BUTTON_TEXT: "📋",
	DELETE_BUTTON_TITLE: "删除消息",
	DELETE_BUTTON_TEXT: "🗑️",

	// Error messages
	NO_RESPONSE: "服务器没有响应",
	ERROR_PREFIX: "错误",
} as const;

export const UI_CONFIG = {
	// View type identifier
	VIEW_TYPE: "ai-assistant-view",
	VIEW_ICON: "sparkles",

	// Textarea auto-resize config
	TEXTAREA_MAX_HEIGHT: 120,
	TEXTAREA_MIN_HEIGHT: 40,

	// Loading animation
	LOADING_DOTS_COUNT: 3,
} as const;
