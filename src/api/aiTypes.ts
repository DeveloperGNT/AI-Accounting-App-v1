// Mirrors ai-accounting-app-be/src/modules/ai/dto/ai.dto.ts (extraction
// upgrade). Every extracted field is optional: the backend returns null-free
// JSON where unreadable values are simply absent, surfaced to the reviewer as
// structured warnings instead of fabricated data.
export interface AiChatResponse {
  text: string;
}

export interface AiExtractBillRequest {
  fileId: string;
}

export interface ExtractedSupplier {
  name?: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ExtractedInvoice {
  number?: string;
  date?: string; // YYYY-MM-DD when reliably readable
  dueDate?: string;
  poNumber?: string;
  placeOfSupply?: string;
}

export interface ExtractedItem {
  description?: string;
  hsn?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
  taxableAmount?: number;
  itcEligible?: boolean;
}

export interface ExtractedTax {
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;
  roundOff?: number;
}

export interface ExtractedTotals {
  subtotal?: number;
  totalDiscount?: number;
  taxableAmount?: number;
  totalTax?: number;
  grandTotal?: number;
}

export interface ExtractedBillDocument {
  supplier: ExtractedSupplier;
  invoice: ExtractedInvoice;
  items: ExtractedItem[];
  tax: ExtractedTax;
  totals: ExtractedTotals;
}

export type ExtractionWarningSeverity = 'error' | 'warning' | 'info';

export interface ExtractionWarning {
  code: string;
  message: string;
  severity: ExtractionWarningSeverity;
  field?: string;
}

export interface FieldConfidence {
  field: string;
  confidence: number; // 0-1, advisory
}

// Vendor proposed by exact-GSTIN match against the tenant's vendor master.
// vendorId is resolved by the backend — never by the AI.
export interface ExtractionVendorMatch {
  vendorId: string;
  vendorName: string;
  gstin?: string;
}

export interface ExtractionDuplicate {
  billId: string;
  billNumber?: string;
  vendorInvoiceNumber?: string;
  billDate?: string;
  grandTotal?: number;
}

export interface AiExtractionProposal {
  suggestion: string;
  proposedAction: ExtractedBillDocument;
  overallConfidence: number; // 0-1, advisory — not a guarantee
  fieldConfidence: FieldConfidence[];
  warnings: ExtractionWarning[];
  vendorMatch: ExtractionVendorMatch | null;
  duplicate: ExtractionDuplicate | null;
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
