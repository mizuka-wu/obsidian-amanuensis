/**
 * 验证端口号的有效性
 * @param portStr 端口号字符串
 * @returns 验证后的端口号，如果无效则返回 null
 */
export function validatePort(portStr: string): number | null {
	const port = parseInt(portStr, 10);
	if (isNaN(port) || port <= 0 || port > 65535) {
		return null;
	}
	return port;
}

/**
 * 获取端口验证错误消息
 * @param portStr 端口号字符串
 * @returns 错误消息
 */
export function getPortErrorMessage(portStr: string): string {
	return `无效的端口号: ${portStr}`;
}
