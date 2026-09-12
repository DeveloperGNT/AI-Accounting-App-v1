// Mirrors ai-accounting-app-be/src/modules/invoices (invoice.entity.ts, DTOs).
// The backend owns invoice numbering: drafts are created as DRAFT-<timestamp>
// and only receive a real sequential number when finalized.
export type ApiInvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  organizationId: string;
  invoiceId: string;
  productId?: string;
  description: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate?: string;
  status: ApiInvoiceStatus;
  customerNameSnapshot: string;
  customerGstinSnapshot?: string;
  customerAddressSnapshot?: unknown;
  grossSubtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  journalEntryId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Present only on GET /invoices/:id (findOne includes relations); the list
  // endpoint returns invoices without items.
  items?: InvoiceItem[];
  customer?: {
    id: string;
    name: string;
    gstin?: string;
    state?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateInvoiceItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface CreateInvoiceDto {
  customerId: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  items: CreateInvoiceItemDto[];
}

export type UpdateInvoiceDto = Partial<CreateInvoiceDto>;

export interface DeleteInvoiceResponse {
  success: boolean;
}
