import { Mastra } from "@mastra/core/mastra";
import { Agent } from "@mastra/core/agent";
import { MCPServer } from "@mastra/mcp";

export const mastra = new Mastra({});

export const mcpServer = new MCPServer({
	id: "amanuensis-mcp-server",
	name: "Amanuensis MCP Server",
	version: "1.0.0",
	tools: {},
});

export function createChatAgent(
	modelId: string,
	apiKey: string,
	baseUrl?: string,
): Agent {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const agentConfig: any = {
		id: "chat-agent",
		name: "Chat Agent",
		model: {
			id: modelId,
			apiKey,
		},
	};

	if (baseUrl) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		agentConfig.model.url = baseUrl;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	return new Agent(agentConfig);
}
