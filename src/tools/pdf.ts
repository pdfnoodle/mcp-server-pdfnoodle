import { z } from "zod";
import { client } from "../client.js";
import type {
  PdfSuccessResponse,
  PdfQueuedResponse,
  PdfStatusResponse,
} from "../types.js";

export const generatePdf = {
  name: "generate_pdf",
  description:
    "Generate a PDF document using a saved template and data. Templates are pre-configured with proper PDF formatting. For custom HTML conversion, use 'html_to_pdf' with the 'pdf-html-guidelines' prompt instead.",
  schema: z.object({
    templateId: z.string().describe("ID of the template to use"),
    data: z
      .string()
      .describe("JSON string containing the template variables"),
    convertToImage: z
      .boolean()
      .optional()
      .describe("Return a PNG image instead of PDF"),
    metadata: z
      .string()
      .optional()
      .describe("JSON string of PDF metadata (title, author, etc.)"),
    s3_bucket: z
      .string()
      .optional()
      .describe("S3 bucket ID for storing the file"),
    s3_key: z.string().optional().describe("S3 path for the file"),
    signedUrlExpiresIn: z
      .number()
      .optional()
      .describe("URL expiration time in seconds"),
    hasCover: z
      .boolean()
      .optional()
      .describe("Hide header/footer on first page"),
    debug: z.boolean().optional().describe("Enable debug mode"),
  }),
  handler: async (
    apiKey: string,
    args: {
      templateId: string;
      data: string;
      convertToImage?: boolean;
      metadata?: string;
      s3_bucket?: string;
      s3_key?: string;
      signedUrlExpiresIn?: number;
      hasCover?: boolean;
      debug?: boolean;
    }
  ) => {
    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(args.data);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: "Invalid JSON in 'data' parameter. Please provide valid JSON.",
          },
        ],
        isError: true,
      };
    }

    const body: Record<string, unknown> = {
      templateId: args.templateId,
      data: parsedData,
    };

    if (args.convertToImage) body.convertToImage = true;
    if (args.hasCover) body.hasCover = true;
    if (args.debug) body.debug = true;
    if (args.signedUrlExpiresIn) body.signedUrlExpiresIn = args.signedUrlExpiresIn;
    if (args.s3_bucket) body.s3_bucket = args.s3_bucket;
    if (args.s3_key) body.s3_key = args.s3_key;

    if (args.metadata) {
      try {
        body.metadata = JSON.parse(args.metadata);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid JSON in 'metadata' parameter.",
            },
          ],
          isError: true,
        };
      }
    }

    const response = await client.call<PdfSuccessResponse | PdfQueuedResponse>(
      apiKey,
      "pdf/sync",
      "POST",
      body
    );

    if (response.status === 200) {
      const data = response.data as PdfSuccessResponse;
      return {
        content: [
          {
            type: "text" as const,
            text: `PDF generated successfully!\n\nDownload URL: ${data.signedUrl}${
              data.metadata
                ? `\n\nExecution time: ${data.metadata.executionTime}\nFile size: ${data.metadata.fileSize}`
                : ""
            }`,
          },
        ],
      };
    }

    // Status 202 - queued
    const queuedData = response.data as PdfQueuedResponse;
    const result = await client.pollForCompletion(apiKey, queuedData.requestId);

    return {
      content: [
        {
          type: "text" as const,
          text: `PDF generated successfully!\n\nDownload URL: ${result.signedUrl}${
            result.metadata
              ? `\n\nExecution time: ${result.metadata.executionTime}\nFile size: ${result.metadata.fileSize}`
              : ""
          }`,
        },
      ],
    };
  },
};

export const htmlToPdf = {
  name: "html_to_pdf",
  description:
    "Convert HTML content directly to a PDF document. IMPORTANT: Before using this tool, you MUST first read the PDF best practices skill at https://github.com/pdfnoodle/pdf-best-practices (or install via 'npx skills add pdfnoodle/pdf-best-practices'). The HTML must follow print-specific CSS rules including: A4 paper size, 40px margins, page-break controls, proper table formatting with thead/tbody, fixed image dimensions, -webkit-print-color-adjust:exact, and content density optimization to avoid sparse pages. Failure to follow these guidelines will result in poorly formatted PDFs with broken layouts, content splitting across pages inappropriately, and unprofessional output.",
  schema: z.object({
    html: z
      .string()
      .describe(
        "Complete HTML content to render as PDF. Must include: DOCTYPE, full html/head/body structure, @page CSS rules for A4 size and margins, -webkit-print-color-adjust:exact on body, page-break-inside:avoid on content blocks, explicit image dimensions, proper table structure with thead/tbody. See https://github.com/pdfnoodle/pdf-best-practices for complete requirements."
      ),
    pdfParams: z
      .string()
      .optional()
      .describe(
        "JSON string of PDF formatting options. Recommended defaults: {\"format\": \"A4\", \"margin\": {\"top\": \"40px\", \"right\": \"40px\", \"bottom\": \"40px\", \"left\": \"40px\"}, \"printBackground\": true}. Can also include displayHeaderFooter, headerTemplate, footerTemplate for page numbers."
      ),
    convertToImage: z
      .boolean()
      .optional()
      .describe("Return a PNG image instead of PDF"),
    metadata: z
      .string()
      .optional()
      .describe("JSON string of PDF metadata"),
    hasCover: z
      .boolean()
      .optional()
      .describe("Hide header/footer on first page"),
    signedUrlExpiresIn: z
      .number()
      .optional()
      .describe("URL expiration time in seconds"),
    s3_bucket: z.string().optional().describe("S3 bucket ID"),
    s3_key: z.string().optional().describe("S3 path"),
  }),
  handler: async (
    apiKey: string,
    args: {
      html: string;
      pdfParams?: string;
      convertToImage?: boolean;
      metadata?: string;
      hasCover?: boolean;
      signedUrlExpiresIn?: number;
      s3_bucket?: string;
      s3_key?: string;
    }
  ) => {
    const body: Record<string, unknown> = {
      html: args.html,
    };

    if (args.convertToImage) body.convertToImage = true;
    if (args.hasCover) body.hasCover = true;
    if (args.signedUrlExpiresIn) body.signedUrlExpiresIn = args.signedUrlExpiresIn;
    if (args.s3_bucket) body.s3_bucket = args.s3_bucket;
    if (args.s3_key) body.s3_key = args.s3_key;

    if (args.pdfParams) {
      try {
        body.pdfParams = JSON.parse(args.pdfParams);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid JSON in 'pdfParams' parameter.",
            },
          ],
          isError: true,
        };
      }
    }

    if (args.metadata) {
      try {
        body.metadata = JSON.parse(args.metadata);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid JSON in 'metadata' parameter.",
            },
          ],
          isError: true,
        };
      }
    }

    const response = await client.call<PdfSuccessResponse | PdfQueuedResponse>(
      apiKey,
      "html-to-pdf/sync",
      "POST",
      body
    );

    if (response.status === 200) {
      const data = response.data as PdfSuccessResponse;
      return {
        content: [
          {
            type: "text" as const,
            text: `PDF created from HTML!\n\nDownload URL: ${data.signedUrl}${
              data.metadata
                ? `\n\nExecution time: ${data.metadata.executionTime}\nFile size: ${data.metadata.fileSize}`
                : ""
            }`,
          },
        ],
      };
    }

    const queuedData = response.data as PdfQueuedResponse;
    const result = await client.pollForCompletion(apiKey, queuedData.requestId);

    return {
      content: [
        {
          type: "text" as const,
          text: `PDF created from HTML!\n\nDownload URL: ${result.signedUrl}${
            result.metadata
              ? `\n\nExecution time: ${result.metadata.executionTime}\nFile size: ${result.metadata.fileSize}`
              : ""
          }`,
        },
      ],
    };
  },
};

export const checkPdfStatus = {
  name: "check_pdf_status",
  description: "Check the status of an asynchronous PDF generation request",
  schema: z.object({
    requestId: z
      .string()
      .describe("The request ID from a queued PDF generation"),
  }),
  handler: async (apiKey: string, args: { requestId: string }) => {
    const { data } = await client.call<PdfStatusResponse>(
      apiKey,
      `pdf/status/${args.requestId}`
    );

    if (data.renderStatus === "SUCCESS") {
      return {
        content: [
          {
            type: "text" as const,
            text: `PDF is ready!\n\nDownload URL: ${data.signedUrl}${
              data.metadata
                ? `\n\nExecution time: ${data.metadata.executionTime}\nFile size: ${data.metadata.fileSize}`
                : ""
            }`,
          },
        ],
      };
    }

    if (data.renderStatus === "ONGOING") {
      return {
        content: [
          {
            type: "text" as const,
            text: "PDF is still being generated. Please check again shortly.",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: "PDF generation failed. Please try again or contact support.",
        },
      ],
      isError: true,
    };
  },
};

export const pdfTools = [generatePdf, htmlToPdf, checkPdfStatus];
