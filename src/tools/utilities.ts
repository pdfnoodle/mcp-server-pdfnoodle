import { z } from "zod";
import { client } from "../client.js";
import type {
  ToolSuccessResponse,
  UploadUrlResponse,
  CompressPdfResponse,
  SplitPdfResponse,
} from "../types.js";

export const mergePdfs = {
  name: "merge_pdfs",
  description:
    "Merge multiple PDF documents into a single PDF file. Provide at least 2 PDF URLs to combine them in the order specified.",
  schema: z.object({
    urls: z
      .array(z.string())
      .describe(
        "Array of PDF URLs to merge (minimum 2). The PDFs will be combined in the order provided."
      ),
    finalFilename: z
      .string()
      .optional()
      .describe("Custom filename for the merged PDF (must end with .pdf)"),
    expiration: z
      .number()
      .optional()
      .describe(
        "Signed URL expiration time in seconds (60-604800). Default: 3600"
      ),
  }),
  handler: async (
    apiKey: string,
    args: {
      urls: string[];
      finalFilename?: string;
      expiration?: number;
    }
  ) => {
    const body: Record<string, unknown> = {
      urls: args.urls,
    };

    if (args.finalFilename) body.finalFilename = args.finalFilename;
    if (args.expiration) body.expiration = args.expiration;

    const { data } = await client.call<ToolSuccessResponse>(
      apiKey,
      "tools/merge-pdfs",
      "POST",
      body
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `PDFs merged successfully!\n\nDownload URL: ${data.url}\nFile name: ${data.fileName}\nURL valid until: ${data.urlValidUntil}`,
        },
      ],
    };
  },
};

export const splitPdf = {
  name: "split_pdf",
  description:
    "Split a PDF document into multiple parts. You can split by page ranges (e.g., '1-3,4-6') or by fixed intervals (e.g., every 2 pages).",
  schema: z.object({
    url: z.string().describe("URL of the PDF to split"),
    splitMode: z
      .enum(["ranges", "intervals"])
      .optional()
      .describe(
        "Split mode: 'ranges' to specify custom page ranges, 'intervals' to split every N pages. Default: 'intervals'"
      ),
    ranges: z
      .string()
      .optional()
      .describe(
        "Page ranges when splitMode is 'ranges' (e.g., '1-3,4-6,7-10')"
      ),
    interval: z
      .number()
      .optional()
      .describe(
        "Number of pages per split when splitMode is 'intervals'. Default: 1"
      ),
    finalFilename: z
      .string()
      .optional()
      .describe("Base filename for the split PDFs (must end with .pdf)"),
    expiration: z
      .number()
      .optional()
      .describe(
        "Signed URL expiration time in seconds (60-604800). Default: 3600"
      ),
  }),
  handler: async (
    apiKey: string,
    args: {
      url: string;
      splitMode?: string;
      ranges?: string;
      interval?: number;
      finalFilename?: string;
      expiration?: number;
    }
  ) => {
    const body: Record<string, unknown> = {
      url: args.url,
    };

    if (args.splitMode) body.splitMode = args.splitMode;
    if (args.ranges) body.ranges = args.ranges;
    if (args.interval !== undefined) body.interval = args.interval;
    if (args.finalFilename) body.finalFilename = args.finalFilename;
    if (args.expiration) body.expiration = args.expiration;

    const { data } = await client.call<SplitPdfResponse>(
      apiKey,
      "tools/split-pdf",
      "POST",
      body
    );

    if (data.files && Array.isArray(data.files)) {
      const fileList = data.files
        .map(
          (f, i) =>
            `Part ${i + 1}:\n  URL: ${f.url}\n  File: ${f.fileName}\n  Valid until: ${f.urlValidUntil}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `PDF split into ${data.files.length} part(s)!\n\n${fileList}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `PDF split successfully!\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  },
};

export const compressPdf = {
  name: "compress_pdf",
  description:
    "Compress a PDF file to reduce its size. Choose from low, medium, or high compression levels.",
  schema: z.object({
    url: z.string().describe("URL of the PDF to compress"),
    compressLevel: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe(
        "Compression level: 'low' (best quality), 'medium' (balanced), 'high' (smallest size). Default: 'medium'"
      ),
    finalFilename: z
      .string()
      .optional()
      .describe("Custom filename for the compressed PDF (must end with .pdf)"),
    expiration: z
      .number()
      .optional()
      .describe(
        "Signed URL expiration time in seconds (60-604800). Default: 3600"
      ),
  }),
  handler: async (
    apiKey: string,
    args: {
      url: string;
      compressLevel?: string;
      finalFilename?: string;
      expiration?: number;
    }
  ) => {
    const body: Record<string, unknown> = {
      url: args.url,
    };

    if (args.compressLevel) body.compressLevel = args.compressLevel;
    if (args.finalFilename) body.finalFilename = args.finalFilename;
    if (args.expiration) body.expiration = args.expiration;

    const { data } = await client.call<CompressPdfResponse>(
      apiKey,
      "tools/compress-pdf",
      "POST",
      body
    );

    let text = `PDF compressed successfully!\n\nDownload URL: ${data.url}\nFile name: ${data.fileName}\nURL valid until: ${data.urlValidUntil}`;

    if (data.metadata) {
      text += `\n\nOriginal size: ${data.metadata.originalSize}\nCompressed size: ${data.metadata.compressedSize}\nReduction: ${data.metadata.reduction}\nExecution time: ${data.metadata.executionTime}`;
    }

    return {
      content: [
        {
          type: "text" as const,
          text,
        },
      ],
    };
  },
};

export const updatePdfMetadata = {
  name: "update_pdf_metadata",
  description:
    "Update the metadata of a PDF document (title, author, subject, keywords, etc.).",
  schema: z.object({
    url: z.string().describe("URL of the PDF to update"),
    metadata: z
      .string()
      .describe(
        'JSON string of metadata fields to set. Available fields: title, author, subject, keywords (array), creator, copyright, createDate, modDate, pdfVersion (number), producer, marked (boolean), trapped. Example: {"title": "My Doc", "author": "John"}'
      ),
    finalFilename: z
      .string()
      .optional()
      .describe("Custom filename for the updated PDF (must end with .pdf)"),
    expiration: z
      .number()
      .optional()
      .describe(
        "Signed URL expiration time in seconds (60-604800). Default: 3600"
      ),
  }),
  handler: async (
    apiKey: string,
    args: {
      url: string;
      metadata: string;
      finalFilename?: string;
      expiration?: number;
    }
  ) => {
    let parsedMetadata: Record<string, unknown>;
    try {
      parsedMetadata = JSON.parse(args.metadata);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: "Invalid JSON in 'metadata' parameter. Please provide valid JSON.",
          },
        ],
        isError: true,
      };
    }

    const body: Record<string, unknown> = {
      url: args.url,
      metadata: parsedMetadata,
    };

    if (args.finalFilename) body.finalFilename = args.finalFilename;
    if (args.expiration) body.expiration = args.expiration;

    const { data } = await client.call<ToolSuccessResponse>(
      apiKey,
      "tools/update-pdf-metadata",
      "POST",
      body
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `PDF metadata updated successfully!\n\nDownload URL: ${data.url}\nFile name: ${data.fileName}\nURL valid until: ${data.urlValidUntil}`,
        },
      ],
    };
  },
};

export const convertMarkdownToPdf = {
  name: "convert_markdown_to_pdf",
  description:
    "Convert Markdown content to a PDF document. Supports custom CSS and PDF formatting options like page size, margins, and orientation.",
  schema: z.object({
    markdown: z
      .string()
      .describe("The Markdown content to convert to PDF"),
    customCss: z
      .string()
      .optional()
      .describe("Custom CSS to apply to the rendered Markdown"),
    pdfOptions: z
      .string()
      .optional()
      .describe(
        'JSON string of PDF options. Available: format (Letter, Legal, A0-A6, etc.), landscape (boolean), scale (0.1-2), printBackground (boolean), pageRanges (string), margin ({ top, right, bottom, left } as string or number). Example: {"format": "A4", "margin": {"top": "40px", "bottom": "40px"}}'
      ),
    finalFilename: z
      .string()
      .optional()
      .describe("Custom filename for the PDF (must end with .pdf)"),
    expiration: z
      .number()
      .optional()
      .describe(
        "Signed URL expiration time in seconds (60-604800). Default: 3600"
      ),
  }),
  handler: async (
    apiKey: string,
    args: {
      markdown: string;
      customCss?: string;
      pdfOptions?: string;
      finalFilename?: string;
      expiration?: number;
    }
  ) => {
    const body: Record<string, unknown> = {
      markdown: args.markdown,
    };

    if (args.customCss) body.customCss = args.customCss;

    if (args.pdfOptions) {
      try {
        body.pdfOptions = JSON.parse(args.pdfOptions);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid JSON in 'pdfOptions' parameter.",
            },
          ],
          isError: true,
        };
      }
    }

    if (args.finalFilename) body.finalFilename = args.finalFilename;
    if (args.expiration) body.expiration = args.expiration;

    const { data } = await client.call<ToolSuccessResponse>(
      apiKey,
      "tools/convert-markdown-to-pdf",
      "POST",
      body
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `Markdown converted to PDF successfully!\n\nDownload URL: ${data.url}\nFile name: ${data.fileName}\nURL valid until: ${data.urlValidUntil}`,
        },
      ],
    };
  },
};

export const getUploadUrl = {
  name: "get_upload_url",
  description:
    "Generate a pre-signed upload URL for uploading a PDF file to temporary storage. Returns both an upload URL (PUT) and a download URL (GET). Useful when you need to upload a local PDF before using other tools like merge or compress.",
  schema: z.object({
    fileName: z
      .string()
      .optional()
      .describe(
        "Optional filename for the uploaded file. If not provided, a random name will be generated."
      ),
  }),
  handler: async (
    apiKey: string,
    args: {
      fileName?: string;
    }
  ) => {
    const endpoint = args.fileName
      ? `tools/get-signed-upload-url?fileName=${encodeURIComponent(args.fileName)}`
      : "tools/get-signed-upload-url";

    const { data } = await client.call<UploadUrlResponse>(
      apiKey,
      endpoint
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `Upload URL generated!\n\nUpload URL (PUT): ${data.presignedUploadUrl}\nUpload valid until: ${data.uploadUrlValidUntil}\n\nDownload URL (GET): ${data.presignedGetUrl}\nDownload valid until: ${data.getUrlValidUntil}\n\nFile name: ${data.fileName}\n\nUse the Upload URL with a PUT request to upload your PDF, then use the Download URL as input for other tools.`,
        },
      ],
    };
  },
};

export const utilityTools = [
  mergePdfs,
  splitPdf,
  compressPdf,
  updatePdfMetadata,
  convertMarkdownToPdf,
  getUploadUrl,
];
