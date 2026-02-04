#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const apiKey = process.env.PDFNOODLE_API_KEY;

  if (!apiKey) {
    console.error("Error: PDFNOODLE_API_KEY environment variable is required");
    console.error("");
    console.error("Get your API key at: https://app.pdfnoodle.com/api-keys");
    console.error("");
    console.error("Usage:");
    console.error("  PDFNOODLE_API_KEY=your-key npx mcp-server-pdfnoodle");
    process.exit(1);
  }

  const server = createServer(apiKey);
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
