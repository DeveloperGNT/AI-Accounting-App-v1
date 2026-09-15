// Mirrors ai-accounting-app-be/src/modules/expenses
// (entities/expense.entity.ts, entities/expense-item.entity.ts,
// dto/create-expense.dto.ts, dto/post-expense.dto.ts).
//
// The backend owns expense numbering: every expense receives an immutable
// sequential number (prefix + zero-padded counter) at CREATE time — there is
// no DRAFT-<timestamp> placeholder (unlike invoices/bills, which number at
// finalize). Totals are all recomputed server-side from the line items; the
// frontend only sends raw line data plus optional TDS flags.

export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'POSTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REVERSED';

export interface ExpenseItem {
  id: string;
  organizationId: string;
  expenseId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  expenseAccountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// The `vendor`, `journalEntry`, and `items` relations are loaded by the
// backend's findAll/findOne. `vendorNameSnapshot` etc. exist on the entity but
// are NOT populated at create time, so the UI resolves the vendor/category
// display names from the vendors/categories slices instead.
export interface Expense {
  id: string;
  organizationId: string;
  expenseNumber: string;
  status: ExpenseStatus;
  expenseDate: string; // YYYY-MM-DD
  categoryId: string;
  vendorId?: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  tdsApplicable: boolean;
  tdsRate?: number | null;
  tdsAmount?: number | null;
  currency?: string;
  exchangeRate?: number;
  journalEntryId?: string;
  vendorNameSnapshot?: string;
  vendorGstinSnapshot?: string;
  vendorPanSnapshot?: string;
  vendorAddressSnapshot?: unknown;
  createdBy?: string;
  submittedBy?: string;
  approvedBy?: string;
  postedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  items?: ExpenseItem[];
}

export interface CreateExpenseItemDto {
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  expenseAccountId?: string;
}

export interface CreateExpenseDto {
  expenseDate: string;
  vendorId?: string;
  categoryId: string;
  items: CreateExpenseItemDto[];
  notes?: string;
  tdsApplicable?: boolean;
  tdsRate?: number;
}

export interface PostExpenseDto {
  paid: boolean;
  paymentMethod?: string;
  paymentAccountId?: string;
}
