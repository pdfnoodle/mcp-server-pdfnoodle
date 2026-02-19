# mcp-server-pdfnoodle

An MCP server that enables AI assistants to generate PDF documents through [pdf noodle](https://pdfnoodle.com) - create PDFs from templates or raw HTML using natural language.

## What is pdf noodle?

pdf noodle is a PDF generation API that lets you:

- Create reusable PDF templates using AI
- Generate PDFs by filling templates with data
- Convert HTML directly to PDF

## Installation

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pdfnoodle": {
      "command": "npx",
      "args": ["-y", "mcp-server-pdfnoodle"],
      "env": {
        "PDFNOODLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "pdfnoodle": {
      "command": "npx",
      "args": ["-y", "mcp-server-pdfnoodle"],
      "env": {
        "PDFNOODLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Manual Execution

```bash
PDFNOODLE_API_KEY=your-key npx mcp-server-pdfnoodle
```

## Remote Usage

This MCP server can also be used remotely via HTTP, making it compatible with ChatGPT and workflow automation tools like n8n.

### Remote Server URL

The remote MCP server endpoint is:

```
https://mcp.pdfnoodle.com/mcp?api_key={your-api-key}
```

**Authentication**: None (API key is passed via URL query parameter only, no authentication headers required)

### Using with ChatGPT

To use this MCP server with ChatGPT, configure it as a custom GPT or via the MCP settings:

1. **Get your API key** from [pdf noodle](https://pdfnoodle.com)
2. **Configure the MCP server** with the remote URL:
   ```
   https://mcp.pdfnoodle.com/mcp?api_key=your-api-key
   ```
3. ChatGPT will be able to use all available pdf noodle tools through the remote server

**Note**: Replace `your-api-key` with your actual pdf noodle API key in the URL.

### Using with n8n

You can integrate pdf noodle MCP server into your n8n workflows using HTTP Request nodes:

1. **Create an HTTP Request node** in your n8n workflow
2. **Configure the node**:

   - **Method**: `POST`
   - **URL**: `https://mcp.pdfnoodle.com/mcp?api_key=your-api-key`
   - **Authentication**: None (API key is in the URL query parameter)
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body**: JSON-RPC 2.0 format for MCP protocol calls

3. **Example request body** for generating a PDF:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "generate_pdf",
       "arguments": {
         "templateId": "template-id",
         "data": "{\"field\": \"value\"}"
       }
     }
   }
   ```

4. **Example request body** for converting HTML to PDF:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "html_to_pdf",
       "arguments": {
         "html": "<h1>Hello World</h1>",
         "pdfParams": "{\"format\": \"A4\"}"
       }
     }
   }
   ```

**Security Note**: Store your API key securely in n8n credentials or environment variables rather than hardcoding it in the URL.

## Getting an API Key

1. Go to [pdf noodle](https://app.pdfnoodle.com)
2. Create an account or sign in
3. Navigate to API settings to get your key

## Available Tools

### Template Operations

| Tool                      | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `list_templates`          | List all templates in your account                |
| `get_template`            | Get details of a specific template                |
| `get_template_schema`     | Get the variables required by a template          |
| `create_template_with_ai` | Create a new template using AI from a description |

### PDF Generation

| Tool               | Description                              |
| ------------------ | ---------------------------------------- |
| `generate_pdf`     | Generate a PDF from a template with data |
| `html_to_pdf`      | Convert HTML content to PDF              |
| `check_pdf_status` | Check status of async PDF generation     |

### PDF Utilities

| Tool                       | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `merge_pdfs`               | Merge multiple PDF documents into a single file          |
| `split_pdf`                | Split a PDF into parts by ranges or intervals            |
| `compress_pdf`             | Compress a PDF to reduce file size                       |
| `update_pdf_metadata`      | Update PDF metadata (title, author, subject, etc.)       |
| `convert_markdown_to_pdf`  | Convert Markdown content to a PDF document               |
| `get_upload_url`           | Generate a pre-signed URL for uploading a PDF            |
| `check_tool_status`        | Check status of an async tool operation                  |

## PDF Best Practices

**IMPORTANT:** Before using the `html_to_pdf` tool, AI agents should follow the [PDF Best Practices](https://github.com/pdfnoodle/pdf-best-practices) guidelines.

Install the skill:

```bash
npx skills add pdfnoodle/pdf-best-practices
```

Or via npm:

```bash
npm install pdf-best-practices
```

The skill covers:

- **Paper setup**: A4 size, 40px margins
- **Page break control**: Prevent content from breaking awkwardly
- **Content density**: Avoid sparse pages
- **Tables**: Proper formatting with thead/tbody
- **Images**: Fixed dimensions, proper sizing
- **Colors**: `-webkit-print-color-adjust: exact`
- **Document types**: Invoice, report, certificate, letter templates

## Usage Examples

Once configured, you can interact with pdf noodle using natural language:

**Create a template:**

> "Create a professional invoice template with company logo, billing details, line items table, and payment terms"

**Generate a PDF:**

> "Generate an invoice PDF using template abc123 with the following data: company name 'Acme Inc', invoice number 1001, items: Widget ($50), Service ($100)"

**Convert HTML to PDF (recommended workflow):**

> "Convert this report to a well-formatted PDF"

The AI will automatically:
1. Reference the [PDF Best Practices](https://github.com/pdfnoodle/pdf-best-practices) guidelines
2. Create properly structured HTML with page break controls, proper margins, and optimized layout
3. Call `html_to_pdf` with the correct pdfParams for A4 paper and 40px margins

**Quick HTML conversion:**

> "Convert this HTML to PDF: `<h1>Hello World</h1><p>This is a test document</p>`"

## Tool Parameters

### generate_pdf

```json
{
  "templateId": "template-id",
  "data": "{\"field\": \"value\"}",
  "convertToImage": false,
  "hasCover": false
}
```

### html_to_pdf

```json
{
  "html": "<html>...</html>",
  "pdfParams": "{\"format\": \"A4\", \"margin\": {\"top\": \"1cm\"}}",
  "convertToImage": false
}
```

### create_template_with_ai

```json
{
  "displayName": "My Template",
  "prompt": "A detailed description of the template design...",
  "fileUrl": "https://example.com/reference.pdf"
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/pdfnoodle/mcp-server-pdfnoodle.git
cd mcp-server-pdfnoodle

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
PDFNOODLE_API_KEY=your-key npm run dev
```

## License

MIT - see [LICENSE](LICENSE)

## Changelog

| Version | Date       | Changes                                                                    |
| ------- | ---------- | --------------------------------------------------------------------------- |
| 1.2.0   | 2026-02-19 | **Feature**: Added async mode to all utility tools (`async: true` parameter) for large file processing without MCP client timeouts. Added `check_tool_status` tool to poll for async results. |
| 1.1.0   | 2026-02-19 | **Feature**: Added 6 new PDF utility tools — `merge_pdfs`, `split_pdf`, `compress_pdf`, `update_pdf_metadata`, `convert_markdown_to_pdf`, and `get_upload_url` for comprehensive PDF manipulation capabilities. |
| 1.0.3   | 2026-02-18 | **Feature**: Async mode for PDF generation — when `async: true` is set, tools call the `/async` endpoint and return a `requestId` immediately to avoid MCP client timeouts on large PDFs. When the sync endpoint returns 202, tools return the requestId for LLM polling. Updated `check_pdf_status` to instruct re-polling in 5–10 seconds. |
| 1.0.2   | 2026-02-10 | **Bug Fix**: Fixed `get_template` to correctly handle API response format and return all template fields (id, displayName, createdAt, updatedAt, type, style, html). |
| 1.0.1   | 2026-02-10 | **Bug Fix**: Fixed `list_templates` to handle wrapped API responses (`{ templates: [...] }` or `{ data: [...] }`). |
| 1.0.0   | 2026-02-10 | Initial release with support for template operations and PDF generation.     |

## Links

- [pdf noodle](https://pdfnoodle.com) - PDF generation platform
- [pdf noodle API Docs](https://docs.pdfnoodle.com) - API documentation
- [PDF Best Practices](https://github.com/pdfnoodle/pdf-best-practices) - Guidelines for HTML-to-PDF conversion
- [MCP Protocol](https://modelcontextprotocol.io) - Model Context Protocol specification
