import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Organization,
  Invoice,
  PurchaseBill,
  Transaction,
  Expense,
  Customer,
  Vendor,
  BankAccount,
  BankFeedItem,
  BankStatementLine,
  ReviewItem,
  AIInsight,
  AuditLogEntry,
  AppNotification,
  DocumentExtraction,
  Role
} from '../types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_PURCHASE_BILLS,
  INITIAL_EXPENSES,
  INITIAL_TRANSACTIONS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_FEEDS,
  INITIAL_BANK_STATEMENT_LINES,
  INITIAL_REVIEW_ITEMS,
  INITIAL_AI_INSIGHTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  SAMPLE_DOCUMENTS
} from '../data/mockData';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  createOrganization as createOrganizationThunk,
  selectOrganization as selectOrganizationAction,
  updateCurrentOrganization as updateCurrentOrganizationThunk,
} from '../features/organizations/organizationsSlice';
import {
  toCreateOrganizationRequest,
  toUiOrganization,
} from '../features/organizations/orgMappers';
import { fetchCustomers as fetchCustomersThunk } from '../features/customers/customersSlice';
import { fetchVendors as fetchVendorsThunk } from '../features/vendors/vendorsSlice';
import {
  fetchInvoices as fetchInvoicesThunk,
} from '../features/invoices/invoicesSlice';
import {
  toUiInvoice,
  toCreateInvoiceRequest,
} from '../features/invoices/invoiceMappers';
import type { Customer as ApiCustomer } from '../api/customersTypes';
import type { Vendor as ApiVendor } from '../api/vendorsTypes';
import type { UpdateOrganizationRequest } from '../api/types';

// Map an API customer record onto the legacy UI Customer shape used by the
// context consumers (invoices editor, dashboards, etc.). Fields the backend
// does not track yet (outstanding balances, total sales) default to zero.
const toUiCustomer = (c: ApiCustomer): Customer => ({
  id: c.id,
  orgId: c.organizationId,
  name: c.name,
  tradeName: (c as unknown as Record<string, unknown>).tradeName as string | undefined,
  gstin: c.gstin ?? '',
  pan: c.pan ?? '',
  contactPerson: (c as unknown as Record<string, unknown>).contactPerson as string | undefined,
  email: c.email ?? '',
  phone: c.phone ?? '',
  address: c.address ?? '',
  city: c.city ?? '',
  state: c.state ?? '',
  creditLimit: c.creditLimit ?? 0,
  outstandingBalance: (c as unknown as Record<string, unknown>).outstandingBalance as number | undefined ?? 0,
  totalSales: 0,
  paymentTermsDays: c.paymentTermsDays ?? 30,
});

const toUiVendor = (v: ApiVendor): Vendor => ({
  id: v.id,
  orgId: v.organizationId,
  name: v.name,
  tradeName: (v as unknown as Record<string, unknown>).tradeName as string | undefined,
  gstin: v.gstin ?? '',
  pan: v.pan ?? '',
  contactPerson: (v as unknown as Record<string, unknown>).contactPerson as string | undefined,
  email: v.email ?? '',
  phone: v.phone ?? '',
  address: v.address ?? '',
  city: v.city ?? '',
  state: v.state ?? '',
  bankAccount: v.bankAccount,
  bankIfsc: v.bankIfsc,
  bankName: v.bankName,
  outstandingBalance: 0,
  payablesBalance: 0,
  totalPurchases: 0,
  paymentTermsDays: v.paymentTermsDays ?? 30,
});

export interface CreateOrganizationParams extends Omit<Organization, 'id' | 'createdAt' | 'userRole'> {
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  openingBalance?: number;
  industry?: string;
  chartOfAccountsTemplate?: string;
}

interface AccountingContextType {
  // Auth & Tenant State
  currentUser: User | null;
  currentOrg: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => void;
  createOrganization: (orgData: CreateOrganizationParams) => Promise<Organization>;
  updateOrganization: (orgId: string | Partial<Organization>, data?: Partial<Organization>) => void;

  // Accounting Records State
  invoices: Invoice[];
  purchaseBills: PurchaseBill[];
  transactions: Transaction[];
  expenses: Expense[];
  customers: Customer[];
  vendors: Vendor[];
  bankAccounts: BankAccount[];
  bankFeeds: BankFeedItem[];
  bankStatementLines: BankStatementLine[];
  reviewItems: ReviewItem[];
  insights: AIInsight[];
  auditLogs: AuditLogEntry[];
  notifications: AppNotification[];
  documents: DocumentExtraction[];

  // NOTE: no invoice mutations here — SalesView and InvoiceCreationFlow use
  // the invoicesSlice thunks directly (create/finalize/cancel/update/delete),
  // so every invoice operation flows through dispatch().

  addPurchaseBill: (bill: Omit<PurchaseBill, 'id' | 'orgId'>) => PurchaseBill;
  updatePurchaseBillStatus: (id: string, status: PurchaseBill['status']) => void;
  deletePurchaseBill: (id: string) => void;

  addTransaction: (transaction: Omit<Transaction, 'id' | 'orgId'>) => Transaction;
  addExpense: (expense: Omit<Expense, 'id' | 'orgId'>) => Expense;

  reconcileBankFeed: (feedId: string, action: 'Matched' | 'Ignored') => void;
  reconcileStatementLine: (lineId: string, matchedTxId?: string) => void;
  handleReviewItem: (reviewId: string, action: 'Accepted' | 'Dismissed') => void;
  resolveReviewItem: (reviewId: string, resolution: 'Approved' | 'Rejected') => void;
  handleDocumentApproval: (docId: string, action: 'Approved' | 'Rejected') => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Computed Financial Metrics
  metrics: {
    revenue: number;
    expenses: number;
    netProfit: number;
    cashAndBank: number;
    receivables: number;
    payables: number;
    gstOutputLiability: number;
    gstInputCredit: number;
    gstNetPayable: number;
    overdueInvoicesCount: number;
    pendingReviewCount: number;
  };
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_ORG_ID: 'ai_acc_current_org_id',
  ORGS: 'ai_acc_orgs',
  PURCHASE_BILLS: 'ai_acc_purchase_bills',
  TRANSACTIONS: 'ai_acc_transactions',
  EXPENSES: 'ai_acc_expenses',
  BANK_ACCOUNTS: 'ai_acc_banks',
  BANK_FEEDS: 'ai_acc_feeds',
  BANK_STMT_LINES: 'ai_acc_stmt_lines',
  REVIEW_ITEMS: 'ai_acc_review',
  AUDIT_LOGS: 'ai_acc_audit',
  NOTIFICATIONS: 'ai_acc_notifs',
  DOCUMENTS: 'ai_acc_docs',
};

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication is owned by Redux/Supabase; this remains for existing business display/audit consumers.
  const [currentUser] = useState<User | null>(null);

  const dispatch = useAppDispatch();
  // Real backend organization state (Redux). Falls back to mock data only
  // while the API data has not loaded (e.g. offline dev), never merged.
  const orgState = useAppSelector((state) => state.organizations);
  const hasApiOrgs = orgState.items.length > 0 || orgState.status === 'succeeded';
  const organizations = hasApiOrgs
    ? orgState.items.map(toUiOrganization)
    : INITIAL_ORGANIZATIONS;
  const currentOrg = hasApiOrgs
    ? (orgState.items.find((o) => o.id === orgState.activeOrganizationId)
        ? toUiOrganization(
            orgState.items.find((o) => o.id === orgState.activeOrganizationId)!,
          )
        : null)
    : organizations[0] || null;

  // Customer and vendor masters come from the backend via the customers/
  // vendors Redux slices (GET /customers, GET /vendors). The backend's
  // TenantAccessGuard rejects any request without the x-organization-id
  // header, so wait until an active organization is resolved before fetching,
  // and refetch whenever the tenant switches so lists never mix tenants.
  const activeOrganizationId = useAppSelector(
    (state) => state.organizations.activeOrganizationId,
  );

  useEffect(() => {
    if (activeOrganizationId) {
      void dispatch(fetchCustomersThunk());
    }
  }, [activeOrganizationId, dispatch]);

  useEffect(() => {
    if (activeOrganizationId) {
      void dispatch(fetchVendorsThunk());
    }
  }, [activeOrganizationId, dispatch]);

  const customersState = useAppSelector((state) => state.customers);
  const vendorsState = useAppSelector((state) => state.vendors);

  const customers = useMemo<Customer[]>(
    () => customersState.items.map(toUiCustomer),
    [customersState.items],
  );
  const vendors = useMemo<Vendor[]>(
    () => vendorsState.items.map(toUiVendor),
    [vendorsState.items],
  );

  // Invoices come from the backend via the invoices Redux slice
  // (GET /invoices). Like customers/vendors, the fetch must wait for an
  // active organization (TenantAccessGuard rejects headerless requests) and
  // re-run when the tenant switches.
  const invoicesState = useAppSelector((state) => state.invoices);
  useEffect(() => {
    if (activeOrganizationId) {
      void dispatch(fetchInvoicesThunk());
    }
  }, [activeOrganizationId, dispatch]);

  const invoices = useMemo<Invoice[]>(
    () => invoicesState.items.map(toUiInvoice),
    [invoicesState.items],
  );

  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASE_BILLS);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_BILLS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [bankFeeds, setBankFeeds] = useState<BankFeedItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANK_FEEDS);
    return saved ? JSON.parse(saved) : INITIAL_BANK_FEEDS;
  });

  const [bankStatementLines, setBankStatementLines] = useState<BankStatementLine[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANK_STMT_LINES);
    return saved ? JSON.parse(saved) : INITIAL_BANK_STATEMENT_LINES;
  });

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEW_ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_REVIEW_ITEMS;
  });

  const [insights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [documents, setDocuments] = useState<DocumentExtraction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : SAMPLE_DOCUMENTS;
  });

  // Save changes to localStorage for persistence. Invoices are backend-
  // owned now and no longer persisted locally.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_BILLS, JSON.stringify(purchaseBills));
  }, [purchaseBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANK_FEEDS, JSON.stringify(bankFeeds));
  }, [bankFeeds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANK_STMT_LINES, JSON.stringify(bankStatementLines));
  }, [bankStatementLines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEW_ITEMS, JSON.stringify(reviewItems));
  }, [reviewItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  const addAuditEntry = (action: string, module: string, recordRef: string) => {
    const newEntry: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      orgId: currentOrg?.id || 'org_acme',
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Authorized User',
      userEmail: currentUser?.email || 'user@example.in',
      action,
      module,
      recordRef,
      ipAddress: '103.21.144.92 (India)',
      status: 'Success',
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const switchOrganization = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      dispatch(selectOrganizationAction(target.id));
      addAuditEntry('Switched Organization Tenant', 'Workspace', `Switched to ${target.name}`);
    }
  };

  const createOrganization = async (orgData: CreateOrganizationParams): Promise<Organization> => {
    const result = await dispatch(
      createOrganizationThunk(toCreateOrganizationRequest(orgData)),
    ).unwrap();

    addAuditEntry(
      'Created Organization Tenant',
      'Settings',
      `Organization: ${result.name} (${result.business_type || 'Business'})`,
    );
    return toUiOrganization(result);
  };

  const updateOrganization = (orgIdOrData: string | Partial<Organization>, data?: Partial<Organization>) => {
    const payload = typeof orgIdOrData === 'string' ? (data || {}) : orgIdOrData;

    // The backend PATCH /organizations/current contract only accepts
    // name, slug, business_type, gstin, email, phone, website, logo_url.
    // Other UI fields (address, city, state, PIN, PAN) are not supported by
    // the backend yet and are intentionally not sent.
    const requestPayload: UpdateOrganizationRequest = {
      ...(typeof payload.name === 'string' && payload.name.trim() ? { name: payload.name.trim() } : {}),
      ...(typeof payload.gstin === 'string' && payload.gstin.trim() ? { gstin: payload.gstin.trim() } : {}),
      ...(typeof payload.email === 'string' && payload.email.trim() ? { email: payload.email.trim() } : {}),
      ...(typeof payload.phone === 'string' && payload.phone.trim() ? { phone: payload.phone.trim() } : {}),
    };

    if (Object.keys(requestPayload).length > 0) {
      void dispatch(updateCurrentOrganizationThunk(requestPayload))
        .then(() =>
          addAuditEntry('Updated Business Profile', 'Settings', 'Updated profile settings for organization'),
        )
        .catch(() => undefined);
    }
  };



  // Purchase Bills Mutations
  const addPurchaseBill = (billData: Omit<PurchaseBill, 'id' | 'orgId'>): PurchaseBill => {
    const newBill: PurchaseBill = {
      ...billData,
      id: `bill_${Date.now()}`,
      orgId: currentOrg?.id || 'org_acme',
    };
    setPurchaseBills((prev) => [newBill, ...prev]);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      orgId: currentOrg?.id || 'org_acme',
      date: newBill.date,
      description: `Inward Purchase Bill #${newBill.billNumber}`,
      type: 'Purchase',
      partyName: newBill.vendorName,
      partyType: 'Vendor',
      partyGstin: newBill.vendorGstin,
      amount: newBill.totalAmount,
      taxableAmount: newBill.taxableAmount,
      gstAmount: newBill.cgst + newBill.sgst + newBill.igst,
      gstRate: 18,
      status: newBill.status === 'Paid' ? 'Paid' : 'Categorized',
      account: 'HDFC Current A/c (0060)',
      referenceNo: newBill.billNumber,
    };
    setTransactions((prev) => [newTx, ...prev]);

    addAuditEntry('Created Inward Bill', 'Purchases', `${newBill.billNumber} (${newBill.vendorName})`);
    return newBill;
  };

  const updatePurchaseBillStatus = (id: string, status: PurchaseBill['status']) => {
    setPurchaseBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    addAuditEntry('Updated Bill Status', 'Purchases', `Bill #${id} set to ${status}`);
  };

  const deletePurchaseBill = (id: string) => {
    setPurchaseBills((prev) => prev.filter((b) => b.id !== id));
    addAuditEntry('Deleted Bill', 'Purchases', `Bill #${id}`);
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'orgId'>): Transaction => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}`,
      orgId: currentOrg?.id || 'org_acme',
    };
    setTransactions((prev) => [newTx, ...prev]);
    addAuditEntry('Recorded Transaction', 'Transactions', `${newTx.type}: ${newTx.description}`);
    return newTx;
  };

  const addExpense = (expData: Omit<Expense, 'id' | 'orgId'>): Expense => {
    const newExp: Expense = {
      ...expData,
      id: `exp_${Date.now()}`,
      orgId: currentOrg?.id || 'org_acme',
    };
    setExpenses((prev) => [newExp, ...prev]);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      orgId: currentOrg?.id || 'org_acme',
      date: newExp.date,
      description: newExp.description,
      type: 'Expense',
      partyName: newExp.vendorName || 'Direct Expense',
      partyType: 'Vendor',
      partyGstin: newExp.vendorGstin,
      amount: newExp.amount,
      taxableAmount: newExp.taxableAmount,
      gstAmount: newExp.gstAmount,
      gstRate: newExp.gstRate,
      status: 'Categorized',
      account: newExp.account || 'HDFC Current A/c (0060)',
      referenceNo: newExp.referenceNo,
    };
    setTransactions((prev) => [newTx, ...prev]);

    addAuditEntry('Created Expense Entry', 'Expenses', `${newExp.category} - ${newExp.vendorName || 'Direct'}`);
    return newExp;
  };

  const reconcileBankFeed = (feedId: string, action: 'Matched' | 'Ignored') => {
    setBankFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, status: action } : f))
    );
    addAuditEntry('Bank Reconciliation Action', 'Banking', `Feed item ${feedId} marked as ${action}`);
  };

  const reconcileStatementLine = (lineId: string, matchedTxId?: string) => {
    setBankStatementLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, isReconciled: true, matchedTransactionId: matchedTxId || 'tx_reconciled' }
          : l
      )
    );
    addAuditEntry('Reconciled Bank Statement', 'Banking', `Statement line ${lineId} reconciled`);
  };

  const handleReviewItem = (reviewId: string, action: 'Accepted' | 'Dismissed') => {
    setReviewItems((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status: action } : r))
    );
    addAuditEntry('Processed AI Review Item', 'Review Queue', `Item ${reviewId} marked as ${action}`);
  };

  const resolveReviewItem = (reviewId: string, resolution: 'Approved' | 'Rejected') => {
    setReviewItems((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status: resolution } : r))
    );
    addAuditEntry('Resolved AI Anomaly', 'Review Queue', `Item ${reviewId} marked as ${resolution}`);
  };

  const handleDocumentApproval = (docId: string, action: 'Approved' | 'Rejected') => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: action } : d))
    );

    if (action === 'Approved' && doc.extractedData) {
      addExpense({
        date: doc.extractedData.date,
        category: 'Office Supplies',
        vendorName: doc.extractedData.vendorName,
        vendorGstin: doc.extractedData.gstin,
        description: `Imported via AI OCR from ${doc.fileName} (#${doc.extractedData.invoiceNumber})`,
        amount: doc.extractedData.totalAmount,
        taxableAmount: doc.extractedData.taxableAmount,
        gstAmount: doc.extractedData.cgst + doc.extractedData.sgst + doc.extractedData.igst,
        gstRate: 18,
        paymentMethod: 'Bank Transfer',
        status: 'Approved',
        referenceNo: doc.extractedData.invoiceNumber,
      });
    }

    addAuditEntry('Document OCR Action', 'AI Assistant', `${action} extracted document: ${doc.fileName}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Tenant Scoped Data Slices
  const activeOrgId = currentOrg?.id || 'unassigned';

  const orgInvoices = invoices.filter((i) => (i.orgId || 'org_acme') === activeOrgId);
  const orgPurchaseBills = purchaseBills.filter((b) => (b.orgId || 'org_acme') === activeOrgId);
  const orgTransactions = transactions.filter((t) => (t.orgId || 'org_acme') === activeOrgId);
  const orgExpenses = expenses.filter((e) => (e.orgId || 'org_acme') === activeOrgId);
  const orgCustomers = customers.filter((c) => (c.orgId || 'org_acme') === activeOrgId);
  const orgVendors = vendors.filter((v) => (v.orgId || 'org_acme') === activeOrgId);
  const orgBankAccounts = bankAccounts.filter((b) => (b.orgId || 'org_acme') === activeOrgId);
  const orgBankFeeds = bankFeeds.filter((f) => orgBankAccounts.some(ba => ba.id === f.bankAccountId));
  const orgBankStatementLines = bankStatementLines.filter((s) => orgBankAccounts.some(ba => ba.id === s.bankAccountId));
  const orgReviewItems = reviewItems.filter((r) => (r.orgId || 'org_acme') === activeOrgId);
  const orgInsights = insights.filter((i) => (i.orgId || 'org_acme') === activeOrgId);
  const orgAuditLogs = auditLogs.filter((a) => (a.orgId || 'org_acme') === activeOrgId);
  const orgNotifications = notifications.filter((n) => (n.orgId || 'org_acme') === activeOrgId || !n.orgId);
  const orgDocuments = documents.filter((d: any) => !d.orgId || d.orgId === activeOrgId);

  // Financial Metrics Computation per Organization
  const totalSalesAmount = orgInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalExpenseAmount = orgExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const revenue = totalSalesAmount;
  const expensesTotal = totalExpenseAmount;
  const netProfit = revenue - expensesTotal;
  
  const cashAndBank = orgBankAccounts.reduce((sum, b) => sum + (b.balance || b.currentBalance || 0), 0);
  const receivables = orgCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const payables = orgVendors.reduce((sum, v) => sum + (v.outstandingBalance || v.payablesBalance || 0), 0);

  // GST Breakdown
  const gstOutputLiability = orgInvoices.reduce((sum, i) => sum + (i.cgst + i.sgst + i.igst), 0);
  const gstInputCredit = orgExpenses.reduce((sum, e) => sum + e.gstAmount, 0) + orgPurchaseBills.filter(p => p.itcEligible).reduce((sum, p) => sum + (p.cgst + p.sgst + p.igst), 0);
  const gstNetPayable = Math.max(0, gstOutputLiability - gstInputCredit);

  const overdueInvoicesCount = orgInvoices.filter((i) => i.status === 'Overdue').length;
  const pendingReviewCount = orgReviewItems.filter((r) => r.status === 'Pending').length;

  return (
    <AccountingContext.Provider
      value={{
        currentUser,
        currentOrg,
        organizations,
        switchOrganization,
        createOrganization,
        updateOrganization,

        invoices: orgInvoices,
        purchaseBills: orgPurchaseBills,
        transactions: orgTransactions,
        expenses: orgExpenses,
        customers: orgCustomers,
        vendors: orgVendors,
        bankAccounts: orgBankAccounts,
        bankFeeds: orgBankFeeds,
        bankStatementLines: orgBankStatementLines,
        reviewItems: orgReviewItems,
        insights: orgInsights.length > 0 ? orgInsights : insights,
        auditLogs: orgAuditLogs,
        notifications: orgNotifications,
        documents: orgDocuments,

        addPurchaseBill,
        updatePurchaseBillStatus,
        deletePurchaseBill,
        addTransaction,
        addExpense,
        reconcileBankFeed,
        reconcileStatementLine,
        handleReviewItem,
        resolveReviewItem,
        handleDocumentApproval,
        markNotificationRead,
        markAllNotificationsRead,

        metrics: {
          revenue,
          expenses: expensesTotal,
          netProfit,
          cashAndBank,
          receivables,
          payables,
          gstOutputLiability,
          gstInputCredit,
          gstNetPayable,
          overdueInvoicesCount,
          pendingReviewCount,
        },
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
