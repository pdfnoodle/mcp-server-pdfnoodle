# CLAUDE.md - Project Guide for AI Assistants

## Mandatory Rules for Every Change

**IMPORTANT: Whenever you make ANY change to this project, you MUST:**

1. **Bump the version** in `package.json` (`"version"` field) following semver:
   - Patch (x.x.X): bug fixes, small tweaks
   - Minor (x.X.0): new features, non-breaking changes
   - Major (X.0.0): breaking changes
2. **Add a changelog entry** in the `## Changelog` table at the bottom of `README.md`, following the existing format:
   ```
   | <version> | <YYYY-MM-DD> | **<Type>**: Description of changes. |
   ```
   Types: `Feature`, `Bug Fix`, `Refactor`, `Docs`, `Breaking Change`

---

## Project Overview

**mcp-server-pdfnoodle** is an MCP (Model Context Protocol) server that enables AI assistants (Claude, ChatGPT, etc.) to generate PDF documents through the [pdf noodle](https://pdfnoodle.com) API.

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js >= 18 (ES Modules)
- **Protocol:** MCP over stdio (JSON-RPC 2.0)
- **License:** MIT
- **npm package:** `mcp-server-pdfnoodle`
- **Repository:** https://github.com/pdfnoodle/mcp-server-pdfnoodle

## Architecture

```
src/
├── index.ts          # CLI entry point (shebang, reads PDFNOODLE_API_KEY, starts server)
├── server.ts         # MCP server setup (createServer, tool registration loop)
├── client.ts         # PdfNoodleClient class (HTTP calls to api.pdfnoodle.com/v1/)
├── types.ts          # TypeScript interfaces (API responses, templates)
└── tools/
    ├── index.ts      # Tool registry (exports combined tools array)
    ├── templates.ts  # 4 template tools (list, get, getSchema, createWithAi)
    └── pdf.ts        # 3 PDF tools (generate, htmlToPdf, checkStatus)
```

**Key design patterns:**
- Tool-based architecture: each tool is an object with `name`, `description`, `schema` (Zod), and `handler`
- Single API client singleton (`client` in `client.ts`) shared across all tools
- Dual-mode PDF generation: sync (immediate) and async (polling via requestId)
- All tool handlers receive `(apiKey, args)` and return MCP content responses

## Available Tools (7 total)

### Template Tools
| Tool | Endpoint | Method |
|------|----------|--------|
| `list_templates` | `GET /integration/templates` | Lists all templates |
| `get_template` | `GET /integration/templates/{id}` | Gets template details (handles creation status) |
| `get_template_schema` | `GET /integration/templates/{id}/variables` | Gets required variables |
| `create_template_with_ai` | `POST /integration/templates/create` | Creates template from AI prompt |

### PDF Tools
| Tool | Endpoint | Method |
|------|----------|--------|
| `generate_pdf` | `POST /pdf/sync` or `/pdf/async` | Generates PDF from template + data |
| `html_to_pdf` | `POST /html-to-pdf/sync` or `/html-to-pdf/async` | Converts raw HTML to PDF |
| `check_pdf_status` | `GET /pdf/status/{requestId}` | Polls async generation status |

## Commands

```bash
# Build (compiles src/ -> dist/)
npm run build        # or: yarn build

# Start server (runs compiled output)
npm start            # or: node dist/index.js

# Development mode (auto-reload)
PDFNOODLE_API_KEY=your-key npm run dev

# Run directly
PDFNOODLE_API_KEY=your-key npx mcp-server-pdfnoodle
```

There are **no tests** configured in this project currently.

## Dependencies

| Package | Role |
|---------|------|
| `@modelcontextprotocol/sdk` | MCP protocol server + stdio transport |
| `zod` | Runtime schema validation for tool arguments |

Dev: `typescript`, `tsx` (dev runner), `@types/node`

## Key Files to Know

- **`package.json`** — Version is here (`"version"`). The `"files": ["dist"]` field ensures only compiled output is published to npm.
- **`README.md`** — Changelog table is at the bottom. User-facing documentation.
- **`src/client.ts`** — API base URL: `https://api.pdfnoodle.com/v1/`. Handles 200 and 202 status codes. Has `pollForCompletion()` with exponential backoff (max 20 attempts).
- **`src/server.ts`** — Has a type cast workaround for registering tools with McpServer (lines 14-24).
- **`src/tools/pdf.ts`** — Largest file (~360 lines). Contains async/sync dual-mode logic and JSON parsing with error handling.
- **`tsconfig.json`** — Target: ES2022, Module: NodeNext, strict mode, source maps enabled.

## API Integration

- Base URL: `https://api.pdfnoodle.com/v1/`
- Auth: Bearer token via `PDFNOODLE_API_KEY` environment variable
- Remote MCP endpoint: `https://mcp.pdfnoodle.com/mcp?api_key={key}`
- Async flow: call `/async` endpoint -> get `requestId` -> poll `/pdf/status/{requestId}` until SUCCESS/FAILED

## Important Notes

- The server communicates via **stdio** (stdin/stdout), not HTTP
- All tool parameters use **Zod schemas** for validation
- JSON string parameters (`data`, `metadata`, `pdfParams`) are parsed inside handlers with try/catch
- The `list_templates` handler handles both array and wrapped `{ templates: [] }` / `{ data: [] }` responses
- The `get_template` handler distinguishes between completed templates (with `template` field) and in-progress ones (with `status` field)
