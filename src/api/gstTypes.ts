// Mirrors ai-accounting-app-be/src/modules/gst (gst-reporting.controller.ts,
// gst-reporting.service.ts, entities/gst-transaction.entity.ts).
// Route: GET /api/v1/organizations/{organizationId}/gst/reports/{register}
// (single global prefix — the controller does NOT hardcode api/v1).

export type GstSourceDocumentType = 'INVOICE' | 'PURCHASE_BILL' | 'EXPENSE';

export type GstSupplyType = 'INTRA_STATE' | 'INTER_STATE';

export interface GstTransaction {
  id: string;
  organizationId: string;
  sourceDocumentType: GstSourceDocumentType;
  sourceDocumentId: string;
  sourceLineId?: string;
  counterpartyId?: string;
  counterpartyGstin?: string;
  counterpartyStateCode?: string;
  supplyType: GstSupplyType;
  transactionDate: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
  isReversal: boolean;
  reversalOfId?: string;
  createdAt: string;
}

export interface GstRegisterSummary {
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalAmount: number;
}

export interface GstRegisterResponse {
  summary: GstRegisterSummary;
  transactions: GstTransaction[];
}

export interface GstSummaryResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  liability: GstRegisterSummary;
  itc: GstRegisterSummary;
  netLiability: {
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
}

export interface GstPeriodParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
