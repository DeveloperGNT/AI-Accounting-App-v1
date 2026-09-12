export type Role = 'Owner' | 'Admin' | 'Accountant' | 'Viewer';
export type UserRole = Role;

export type BusinessType = 
  | 'Proprietorship'
  | 'Partnership'
  | 'LLP'
  | 'Private Limited'
  | 'Public Limited'
  | 'Individual'
  | 'Trust'
  | 'Society'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  tradeName?: string;
  businessType: BusinessType;
  gstin: string;
  pan: string;
  financialYear: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  phone: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  createdAt: string;
  userRole: Role;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPct: number;
  gstRate: number; // e.g. 18 (means 18%)
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orgId: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  // Raw backend lifecycle status (DRAFT | FINALIZED | PARTIALLY_PAID | PAID
  // | CANCELLED). The UI `status` above is the display mapping; apiStatus
  // drives lifecycle actions (finalize/cancel/delete are status-gated).
  apiStatus?: 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  notes?: string;
  termsAndConditions?: string;
  placeOfSupply?: string;
  isInterState?: boolean;
  reverseCharge?: boolean;
  paymentTerms?: string;
  templateId?: string;
}

export type PurchaseBillStatus = 'Received' | 'Paid' | 'Partially Paid' | 'Pending Review' | 'Draft' | 'Overdue';

export interface PurchaseBillItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPct: number;
  gstRate: number;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface PurchaseBill {
  id: string;
  orgId: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  vendorGstin: string;
  date: string;
  dueDate: string;
  items: PurchaseBillItem[];
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  amountPaid: number;
  status: PurchaseBillStatus;
  itcEligible: boolean;
  notes?: string;
}

export type TransactionType = 'Sale' | 'Purchase' | 'Expense' | 'Payment' | 'Receipt' | 'Journal';
export type TransactionStatus = 'Categorized' | 'Paid' | 'Pending Review' | 'Draft' | 'Reconciled';

export interface Transaction {
  id: string;
  orgId: string;
  date: string;
  description: string;
  type: TransactionType;
  partyName: string;
  partyType: 'Customer' | 'Vendor' | 'Bank' | 'Ledger';
  partyGstin?: string;
  amount: number;
  taxableAmount: number;
  gstAmount: number;
  gstRate: number;
  status: TransactionStatus;
  account: string;
  referenceNo?: string;
  isAiFlagged?: boolean;
  aiFlagReason?: string;
}

export type ExpenseCategory = 
  | 'Office Supplies'
  | 'Office Supplies & Stationary'
  | 'Rent & Utilities'
  | 'Rent & Facilities'
  | 'Electricity & Utilities'
  | 'Software & Subscriptions'
  | 'Professional & Legal Fees'
  | 'Travel & Conveyance'
  | 'Marketing & Advertising'
  | 'Salaries & Wages'
  | 'Logistics & Courier'
  | 'Freight & Logistics'
  | 'Maintenance & Repairs'
  | 'Repairs & Maintenance'
  | 'Bank Charges'
  | 'Miscellaneous';

export type PaymentMode = 
  | 'Bank Transfer (NEFT/RTGS)'
  | 'Bank Transfer'
  | 'UPI'
  | 'Corporate Card'
  | 'Credit Card'
  | 'Cash'
  | 'Cheque';

export interface Expense {
  id: string;
  orgId: string;
  date: string;
  category: ExpenseCategory;
  vendorName?: string;
  vendorGstin?: string;
  description: string;
  amount: number;
  taxableAmount: number;
  gstAmount: number;
  gstRate: number;
  paymentMode?: PaymentMode;
  paymentMethod?: 'Bank Transfer' | 'UPI' | 'Corporate Card' | 'Cash' | 'Cheque';
  account?: string;
  tdsDeducted?: number;
  status: 'Approved' | 'Pending' | 'Needs Review' | 'Paid';
  referenceNo?: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  creditLimit?: number;
  outstandingBalance: number;
  totalSales?: number;
  paymentTermsDays: number;
  lastTransactionDate?: string;
}

export interface Vendor {
  id: string;
  orgId: string;
  name: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  outstandingBalance?: number;
  payablesBalance?: number;
  totalPurchases?: number;
  paymentTermsDays?: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
  lastTransactionDate?: string;
}

export interface BankAccount {
  id: string;
  orgId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Current Account' | 'Savings Account' | 'OD Account' | 'Escrow Account';
  branch?: string;
  ifsc: string;
  balance?: number;
  currentBalance?: number;
  bookBalance?: number;
  lastSynced?: string;
  unreconciledCount?: number;
}

export interface BankFeedItem {
  id: string;
  bankAccountId: string;
  date: string;
  narration: string;
  referenceNo: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  status: 'Matched' | 'Uncategorized' | 'Ignored';
  suggestedAction?: 'Match Invoice' | 'Categorize Expense' | 'Record Transfer';
  suggestedEntity?: string;
  matchConfidence?: number;
}

export interface BankStatementLine {
  id: string;
  bankAccountId: string;
  date: string;
  narration: string;
  reference?: string;
  type: 'Credit' | 'Debit';
  amount: number;
  isReconciled: boolean;
  matchedTransactionId?: string;
  suggestedMatch?: {
    partyName: string;
    reason: string;
    confidence: number;
  };
}

export interface ReviewItem {
  id: string;
  orgId?: string;
  transactionId?: string;
  type?: 'Duplicate Transaction' | 'Missing GSTIN' | 'Uncategorized Expense' | 'Unusual Amount' | 'Ledger Mismatch' | 'ITC Reconciliation Risk';
  severity: 'high' | 'medium' | 'low' | 'High' | 'Medium' | 'Low';
  title: string;
  reason?: string;
  explanation?: string;
  suggestedAction: string;
  confidence?: number;
  amount?: number;
  entityName?: string;
  date?: string;
  status: 'Pending' | 'Accepted' | 'Dismissed' | 'Approved' | 'Rejected';
}

export interface AIInsight {
  id: string;
  orgId: string;
  category: 'Receivables' | 'Cash Flow' | 'Tax & GST' | 'Expenses' | 'Vendor Concentration';
  title: string;
  impact: string;
  metric: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
  route: string;
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  module: string;
  recordRef: string;
  ipAddress: string;
  status: 'Success' | 'Flagged';
}

export interface AppNotification {
  id: string;
  orgId: string;
  title: string;
  description: string;
  type: 'alert' | 'info' | 'success' | 'review';
  timestamp: string;
  read: boolean;
  linkRoute?: string;
}

export interface DocumentExtraction {
  id: string;
  fileName: string;
  fileType: 'Tax Invoice' | 'Vendor Bill' | 'Receipt' | 'Bank Statement';
  uploadTime: string;
  status: 'Processing' | 'Ready for Review' | 'Approved' | 'Rejected';
  confidence: number;
  extractedData: {
    vendorName: string;
    gstin: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
    items: Array<{
      description: string;
      hsn: string;
      qty: number;
      rate: number;
      amount: number;
      gstRate: number;
    }>;
  };
}
