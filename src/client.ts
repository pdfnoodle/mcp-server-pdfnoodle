import type {
  ApiResponse,
  PdfStatusResponse,
  PdfSuccessResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.pdfnoodle.com/v1/";

export class PdfNoodleClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
  }

  async call<T>(
    apiKey: string,
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok && response.status !== 202) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as T;
    return { status: response.status, data };
  }

  async pollForCompletion(
    apiKey: string,
    requestId: string,
    maxAttempts = 20
  ): Promise<PdfSuccessResponse> {
    let delay = 2000;
    const maxDelay = 10000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delay));

      const { data } = await this.call<PdfStatusResponse>(
        apiKey,
        `pdf/status/${requestId}`
      );

      if (data.renderStatus === "SUCCESS") {
        return {
          signedUrl: data.signedUrl,
          metadata: data.metadata,
        };
      }

      if (data.renderStatus === "FAILED") {
        throw new Error("PDF generation failed");
      }

      delay = Math.min(delay * 1.5, maxDelay);
    }

    throw new Error("PDF generation timed out");
  }
}

export const client = new PdfNoodleClient();
