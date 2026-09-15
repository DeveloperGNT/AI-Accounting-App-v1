// Mirrors ai-accounting-app-be/src/modules/purchases
// (entities/purchase-bill.entity.ts, entities/purchase-bill-item.entity.ts,
// dto/create-purchase-bill.dto.ts, dto/update-purchase-bill.dto.ts).
//
// The backend owns bill numbering: drafts are created with billNumber
// DRAFT-<timestamp> and only receive a real sequential number at finalize time.
// `findAll` / `findOne` both load the `vendor` and `items` relations, so the
// list payload already includes line items (unlike invoices, whose list omits
// them). Totals are all recomputed server-side; the frontend only sends raw
// line data on create/update.

export type PurchaseBillStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'CANCELLED'
  | 'PAID'
  | 'PARTIALLY_PAID';

export type ItcClaimType =
  | 'ELIGIBLE_INPUTS'
  | 'ELIGIBLE_INPUT_SERVICES'
  | 'ELIGIBLE_CAPITAL_GOODS'
  | 'INELIGIBLE_17_5'
  | 'INELIGIBLE_OTHERS';

export interface PurchaseBillItem {
  id: string;
  organizationId: string;
  purchaseBillId: string;
  productId?: string;
  description: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  lineTotal: number;
  itcEligible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Minimal structural subset of the Vendor entity exposed via the `vendor`
// relation (the backend returns the full record; the UI only reads these).
export interface PurchaseBillVendor {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface PurchaseBill {
  id: string;
  organizationId: string;
  vendorId: string;
  billNumber: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate?: string;
  status: PurchaseBillStatus;
  vendorNameSnapshot?: string;
  vendorGstinSnapshot?: string;
  vendorPanSnapshot?: string;
  vendorAddressSnapshot?: unknown;
  grossSubtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxTotal: number;
  grandTotal: number;
  itcEligible: boolean;
  itcClaimType: ItcClaimType;
  itcClaimedAmount: number;
  itcBlockedAmount: number;
  placeOfSupply?: string;
  isInterState: boolean;
  reverseCharge: boolean;
  notes?: string;
  terms?: string;
  journalEntryId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  vendor?: PurchaseBillVendor;
  items?: PurchaseBillItem[];
}

export interface CreatePurchaseBillItemDto {
  productId?: string;
  description: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  itcEligible?: boolean;
}

export interface CreatePurchaseBillDto {
  vendorId: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate?: string;
  placeOfSupply?: string;
  isInterState?: boolean;
  reverseCharge?: boolean;
  itcEligible?: boolean;
  itcClaimType?: ItcClaimType;
  notes?: string;
  terms?: string;
  items: CreatePurchaseBillItemDto[];
}

export type UpdatePurchaseBillDto = Partial<CreatePurchaseBillDto>;

export interface DeletePurchaseBillResponse {
  success: boolean;
}
