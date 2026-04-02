/**
 * @fileoverview Amanuensis Server
 * @description
 */
import express from "express";
import { MastraServer } from "@mastra/express";
import { mastra, mcpServer } from "./mastra";

import { validateAndCheckPort } from "./utils/port";
import { PortNotAvailableError } from "./error";

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

	private _serverInstance: Server;
	private _lastError: Error | null = null;

	private constructor(options: AmanuensisServerOptions = {}) {
		this._port = options.port ?? DEFAULT_PORT;
	}

	async init() {
		this.expressApplication = express();
		this.expressApplication.use(express.json());

		// 注册 mastra 的路由
		this.mastra = new MastraServer({
			app: this.expressApplication,
			mastra,
		});

		// 注册 mcp
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
