import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";
import type { z } from "zod";

export function createServer(apiKey: string): McpServer {
  const server = new McpServer({
    name: "pdfnoodle",
    version: "1.0.0",
  });

  for (const tool of tools) {
    const schemaShape = tool.schema.shape as Record<string, z.ZodTypeAny>;

    (
      server as unknown as {
        tool: (
          name: string,
          description: string,
          schema: Record<string, z.ZodTypeAny>,
          handler: (args: Record<string, unknown>) => Promise<unknown>
        ) => void;
      }
    ).tool(tool.name, tool.description, schemaShape, async (args) => {
      try {
        const result = await tool.handler(apiKey, args as never);
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  return server;
}

export function getToolList() {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
  }));
}
