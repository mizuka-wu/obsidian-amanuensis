/**
 * 服务器配置管理
 * 提供动态的服务器地址获取
 */

const DEFAULT_PORT = 8761;

export function getServerBaseUrl(): string {
	// 从全局插件实例获取端口配置
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
	const plugin = (globalThis as any).__amanuensisPlugin as
		| { settings?: { port?: number } }
		| undefined;

	const port = plugin?.settings?.port ?? DEFAULT_PORT;
	return `http://localhost:${port}`;
}

export function getModelsUrl(): string {
	return `${getServerBaseUrl()}/api/models`;
}

export function getChatUrl(): string {
	return `${getServerBaseUrl()}/api/chat`;
}
