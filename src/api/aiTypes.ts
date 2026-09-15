export interface AiChatResponse {
  text: string;
}

export interface AiExtractBillRequest {
  fileId: string;
}

export interface ExtractedBillResponseDto {
  vendorName: string;
  vendorGstin: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD or null
  taxableAmount: number;
  gstRate: number; // percentage e.g. 18
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  hsn?: string;
}

export interface AiExtractionProposal {
  suggestion: string;
  confidence: number; // 0-1
  proposedAction: ExtractedBillResponseDto;
}

export interface AiAuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  status: string;
  provider: string;
  modelUsed: string;
  requestId: string | null;
  promptSummary: string;
  contextSummary: string;
  errorCode: string | null;
  errorMessage: string | null;
  latencyMs: number;
  createdAt: string;
}