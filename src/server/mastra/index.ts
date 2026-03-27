import { Mastra } from "@mastra/core/mastra";
import { MCPServer } from "@mastra/mcp";

export const mastra = new Mastra({});

export const mcpServer = new MCPServer({
	id: "amanuensis-mcp-server",
	name: "Amanuensis MCP Server",
	version: "1.0.0",
	tools: {},
});
