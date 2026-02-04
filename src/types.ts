export interface PdfSuccessResponse {
  signedUrl: string;
  metadata?: {
    executionTime: string;
    fileSize: string;
  };
}

export interface PdfQueuedResponse {
  requestId: string;
  statusUrl: string;
  message: string;
}

export interface PdfStatusResponse {
  requestId: string;
  renderStatus: "ONGOING" | "SUCCESS" | "FAILED";
  signedUrl: string;
  metadata?: {
    executionTime: string;
    fileSize: string;
  };
}

export interface Template {
  id: string;
  displayName: string;
  status?: string;
  createdAt?: string;
}

export interface TemplateDetail extends Template {
  html?: string;
  css?: string;
  schema?: Record<string, unknown>;
}

export interface TemplateCreationResponse {
  id: string;
  statusUrl: string;
  status: string;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}
