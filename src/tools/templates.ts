import { z } from "zod";
import { client } from "../client.js";
import type { Template, TemplateDetail, TemplateCreationResponse } from "../types.js";

export const listTemplates = {
  name: "list_templates",
  description: "Retrieve all available PDF templates from your PDFNoodle account",
  schema: z.object({}),
  handler: async (apiKey: string) => {
    const { data } = await client.call<Template[]>(apiKey, "integration/templates");

    if (!data || data.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No templates found. Use 'create_template_with_ai' to create your first template.",
          },
        ],
      };
    }

    const templateList = data
      .map((t) => `- ${t.displayName} (ID: ${t.id})`)
      .join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${data.length} template(s):\n\n${templateList}\n\nUse 'get_template' with a template ID for details, or 'get_template_schema' to see required variables.`,
        },
      ],
    };
  },
};

export const getTemplate = {
  name: "get_template",
  description: "Fetch a specific PDF template by its ID with full details",
  schema: z.object({
    templateId: z.string().describe("The unique ID of the template to retrieve"),
  }),
  handler: async (apiKey: string, args: { templateId: string }) => {
    const { data } = await client.call<TemplateDetail>(
      apiKey,
      `integration/templates/${args.templateId}`
    );

    if (data.status === "COMPLETED") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Template: ${data.displayName}\nID: ${data.id}\nStatus: Ready\n\nUse 'get_template_schema' to see the variables required to generate a PDF.`,
          },
        ],
      };
    }

    if (data.status === "ONGOING") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Template "${data.displayName}" is still being created. Please check again in a moment.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Template creation failed. Please try creating a new template.`,
        },
      ],
      isError: true,
    };
  },
};

export const getTemplateSchema = {
  name: "get_template_schema",
  description: "Retrieve the variables/schema required by a specific PDF template",
  schema: z.object({
    templateId: z.string().describe("The ID of the template to get the schema for"),
  }),
  handler: async (apiKey: string, args: { templateId: string }) => {
    const { data } = await client.call<Record<string, unknown>>(
      apiKey,
      `integration/templates/${args.templateId}/variables`
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `Template Schema:\n\n${JSON.stringify(data, null, 2)}\n\nUse these variables with 'generate_pdf' to create a PDF.`,
        },
      ],
    };
  },
};

export const createTemplateWithAi = {
  name: "create_template_with_ai",
  description:
    "Create a new reusable PDF template using AI from a natural language description. The AI will generate a template optimized for PDF output with proper page breaks, margins, and formatting. For best results, include specific details about layout, sections, and data fields in your prompt.",
  schema: z.object({
    displayName: z
      .string()
      .describe("Human-readable name for the template (e.g., 'Invoice Template')"),
    prompt: z
      .string()
      .describe(
        "Detailed description of the template design, layout, and fields. Include: document type (invoice, report, certificate, etc.), sections needed, table structures, image placement, header/footer requirements, and any specific formatting preferences. The AI will apply PDF best practices automatically."
      ),
    fileUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional URL to a reference PDF or image file for AI to use as design inspiration"),
  }),
  handler: async (
    apiKey: string,
    args: { displayName: string; prompt: string; fileUrl?: string }
  ) => {
    const body: Record<string, unknown> = {
      displayName: args.displayName,
      prompt: args.prompt,
    };

    if (args.fileUrl) {
      body.fileUrl = args.fileUrl;
    }

    const { data } = await client.call<TemplateCreationResponse>(
      apiKey,
      "integration/templates/create",
      "POST",
      body
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `Template creation started!\n\nTemplate ID: ${data.id}\nStatus: ${data.status}\n\nTemplate creation typically takes 1-2 minutes. Use 'get_template' with the ID above to check when it's ready.`,
        },
      ],
    };
  },
};

export const templateTools = [
  listTemplates,
  getTemplate,
  getTemplateSchema,
  createTemplateWithAi,
];
