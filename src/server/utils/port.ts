/**
 * 对端口进行检测
 * 1. 是否合法
 * 2. 是否占用
 */
import net from "net";
export function validatePort(port: number): boolean {
	return port > 0 && port < 65536;
}

export async function isPortAvailable(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const server = net.createServer();
		server.listen(port, () => {
			server.close();
			resolve(true);
		});
		server.on("error", () => {
			resolve(false);
		});
	});
}

export async function validateAndCheckPort(port: number): Promise<boolean> {
	return validatePort(port) && (await isPortAvailable(port));
}
