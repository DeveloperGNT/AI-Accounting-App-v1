export interface FileRecord {
  id: string;
  organizationId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string;
  status: 'ACTIVE' | 'PROCESSING' | 'DONE' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileResponse {
  message: string;
  file: FileRecord;
}

export interface DeleteFileResponse {
  message: string;
}

export interface DownloadUrlResponse {
  url: string;
}

export interface LinkFilePayload {
  entityType: 'INVOICE' | 'PURCHASE_BILL' | 'EXPENSE' | 'PAYMENT' | 'JOURNAL_ENTRY';
  entityId: string;
  attachmentType: string;
}

export interface LinkFileResponse {
  message: string;
  // Link entity would be returned here based on backend, but keeping it simple for now
  linkId?: string;
}