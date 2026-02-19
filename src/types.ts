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
  id: string;
  displayName: string;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
  style?: string;
  html?: string;
  css?: string;
  schema?: Record<string, unknown>;
}

export interface TemplateCreationResponse {
  id: string;
  statusUrl: string;
  status: string;
}

export interface ToolSuccessResponse {
  url: string;
  fileName: string;
  urlValidUntil: string;
}

export interface UploadUrlResponse {
  presignedUploadUrl: string;
  presignedGetUrl: string;
  status: string;
  fileName: string;
  uploadUrlValidUntil: string;
  getUrlValidUntil: string;
}

export interface CompressPdfResponse extends ToolSuccessResponse {
  metadata?: {
    executionTime: string;
    fileSize: string;
    originalSize: string;
    compressedSize: string;
    reduction: string;
  };
}

export interface SplitPdfResponse {
  files: Array<{
    url: string;
    fileName: string;
    urlValidUntil: string;
  }>;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}
