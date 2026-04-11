/**
 * UI 模块类型定义
 */

import type { ChatMessage as BaseChatMessage } from "../server/types";

export interface ChatMessage extends BaseChatMessage {
	id: string;
	timestamp: number;
}

export interface ChatResponse {
	response?: string;
	error?: string;
}

export interface ModelEntry {
	id: string;
	name: string;
	modelId: string;
	providerId: string;
	enabled: boolean;
}
