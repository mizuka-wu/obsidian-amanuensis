/**
 * 响应验证器
 * 验证服务器响应的格式和内容
 */

import type { ChatResponse } from "./types";

export function validateChatResponse(data: unknown): ChatResponse {
	if (!data || typeof data !== "object") {
		return { error: "Invalid response format" };
	}

	const obj = data as Record<string, unknown>;

	// 优先检查 response 字段
	const response = obj.response;
	if (typeof response === "string" && response.length > 0) {
		return { response };
	}

	// 其次检查 error 字段
	const error = obj.error;
	if (typeof error === "string" && error.length > 0) {
		return { error };
	}

	// 如果都没有，返回错误
	return { error: "Invalid response format" };
}
