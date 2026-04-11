/**
 * @fileoverview Amanuensis Server
 * @description
 */
import express from "express";
import { MastraServer } from "@mastra/express";
import { mastra, mcpServer } from "./mastra";

import { validateAndCheckPort } from "./utils/port";
import { PortNotAvailableError } from "./error";
import { ChatHandler } from "./chat-handler";

import { type Server } from "http";

export const DEFAULT_PORT = 8761 as const;

export type AmanuensisServerOptions = {
	port?: number;
};

export class AmanuensisServer {
	/**
	 * The port the server will listen on.
	 */
	private _port: number = DEFAULT_PORT;

	private expressApplication: express.Application;
	private mastra: MastraServer;
	private chatHandler: ChatHandler;

	private _serverInstance: Server;
	private _lastError: Error | null = null;

	private constructor(options: AmanuensisServerOptions = {}) {
		this._port = options.port ?? DEFAULT_PORT;
		this.chatHandler = new ChatHandler();
	}

	async init() {
		this.expressApplication = express();
		this.expressApplication.use(express.json());

		// 注册 mastra 的路由
		this.mastra = new MastraServer({
			app: this.expressApplication,
			mastra,
		});

		// 注册模型列表 API 端点
		this.expressApplication.get("/api/models", async (req, res) => {
			try {
				const response = await this.handleGetModels();
				res.json(response);
			} catch (error) {
				console.error("Get models error:", error);
				res.status(500).json({
					error: "Failed to fetch models",
				});
			}
		});

		// 注册聊天 API 端点

		this.expressApplication.post("/api/chat", async (req, res) => {
			try {
				const { message, modelId } = req.body as {
					message?: string;
					modelId?: string;
				};

				if (!message || typeof message !== "string") {
					res.status(400).json({
						error: "Message is required",
					});
					return;
				}

				if (!modelId || typeof modelId !== "string") {
					res.status(400).json({
						error: "Model ID is required",
					});
					return;
				}

				const response = await this.handleChatMessage(message, modelId);

				res.json({
					response,
				});
			} catch (error) {
				console.error("Chat error:", error);
				res.status(500).json({
					error: "Internal server error",
				});
			}
		});

		// 注册清空对话历史 API 端点
		this.expressApplication.post("/api/chat/reset", async (req, res) => {
			try {
				this.chatHandler.resetConversation();
				res.json({ success: true });
			} catch (error) {
				console.error("Reset chat error:", error);
				res.status(500).json({
					error: "Failed to reset conversation",
				});
			}
		});

		// 注册删除消息 API 端点
		this.expressApplication.post("/api/chat/delete", async (req, res) => {
			try {
				const { messageId } = req.body as { messageId?: string };

				if (!messageId || typeof messageId !== "string") {
					res.status(400).json({
						error: "Message ID is required",
					});
					return;
				}

				const deleted = this.chatHandler.deleteMessage(messageId);
				res.json({ success: deleted });
			} catch (error) {
				console.error("Delete message error:", error);
				res.status(500).json({
					error: "Failed to delete message",
				});
			}
		});

		// 注册 mcp

		this.expressApplication.post("/mcp", async (req, res) => {
			try {
				await mcpServer.startHTTP({
					url: new URL(req.url || ""),
					httpPath: req.path,
					req,
					res,
					options: {
						serverless: true,
					},
				});
			} catch {
				res.sendStatus(500);
			}
		});

		// 初始化 mastra
		await this.mastra.init();
	}

	private async handleGetModels(): Promise<{
		models: Array<{
			id: string;
			name: string;
			modelId: string;
			providerId: string;
			enabled: boolean;
		}>;
	}> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
			const plugin = (globalThis as any).__amanuensisPlugin;
			if (!plugin) {
				console.warn("Plugin instance not available");
				return { models: [] };
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (!plugin.settings || !Array.isArray(plugin.settings.models)) {
				console.warn("Plugin settings or models array not available");
				return { models: [] };
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const models = plugin.settings.models as Array<{
				id: string;
				name: string;
				modelId: string;
				providerId: string;
				enabled: boolean;
			}>;
			return { models };
		} catch (error) {
			console.error(
				"Error getting models:",
				error instanceof Error ? error.message : String(error),
			);
			return { models: [] };
		}
	}

	private async handleChatMessage(
		message: string,
		modelId: string,
	): Promise<string> {
		try {
			return await this.chatHandler.processMessage(message, modelId);
		} catch (error) {
			console.error("Error handling chat message:", error);
			const errorMsg =
				error instanceof Error ? error.message : String(error);
			return `错误: ${errorMsg}`;
		}
	}

	async start(port: number = this._port) {
		this._lastError = null;

		if (!this.expressApplication) {
			throw new Error("Server not initialized. Call create() first.");
		}

		// 先停止服务器
		await this.stop();

		this._port = port;
		if (!(await validateAndCheckPort(this._port))) {
			throw new PortNotAvailableError(this._port);
		}

		this._serverInstance = await new Promise((resolve, reject) => {
			const server = this.expressApplication.listen(port, (error) => {
				if (error) {
					this._lastError =
						error instanceof Error
							? error
							: new Error(String(error));
					reject(this._lastError);
				} else {
					resolve(server);
				}
			});
		});
	}

	async stop() {
		if (this._serverInstance) {
			await new Promise((resolve, reject) => {
				this._serverInstance.close((error) => {
					if (error) {
						this._lastError = error;
						reject(error);
					} else {
						resolve(undefined);
					}
				});
			});
		}
	}

	get error() {
		return this._lastError;
	}

	static async create(
		options: AmanuensisServerOptions = {},
	): Promise<AmanuensisServer> {
		if (!(await validateAndCheckPort(options.port ?? DEFAULT_PORT))) {
			throw new PortNotAvailableError(options.port ?? DEFAULT_PORT);
		}

		const server = new AmanuensisServer(options);
		await server.init();
		return server;
	}
}
