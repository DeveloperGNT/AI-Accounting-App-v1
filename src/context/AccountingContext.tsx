import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Organization,
  Invoice,
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
  INITIAL_TRANSACTIONS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_FEEDS,
  INITIAL_BANK_STATEMENT_LINES,
  INITIAL_REVIEW_ITEMS,
  INITIAL_AI_INSIGHTS,
  INITIAL_AUDIT_LOGS,
  SAMPLE_DOCUMENTS
} from '../data/mockData';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotificationPreferences,
  updateNotificationPreference
} from '../features/notifications/notificationsSlice';
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
import { fetchCategories as fetchCategoriesThunk } from '../features/categories/categoriesSlice';
import {
  fetchInvoices as fetchInvoicesThunk,
} from '../features/invoices/invoicesSlice';
import { fetchExpenses as fetchExpensesThunk } from '../features/expenses/expensesSlice';
import {
  toUiInvoice,
  toCreateInvoiceRequest,
} from '../features/invoices/invoiceMappers';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsInitializing,
} from '../features/auth/authSlice';
import type { Customer as ApiCustomer } from '../api/customersTypes';
import type { Vendor as ApiVendor } from '../api/vendorsTypes';
import type { Expense as ApiExpense } from '../api/expensesTypes';
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

// Map a backend expense onto the legacy UI Expense shape still consumed by
// DashboardView / ReportsView / GlobalSearchModal. The backend loads the
// `items` relation but does NOT hydrate a `category` or `vendor` relation, so
// the category/vendor display names are resolved from the categories/vendors
// slices (passed in as lookups). `findAll`/`findOne` also leave the vendor
// name/GSTIN snapshots empty at create time.
const toUiExpenseStatus = (status: ApiExpense['status']): Expense['status'] => {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'POSTED':
      return 'Paid';
    case 'REJECTED':
    case 'CANCELLED':
    case 'REVERSED':
      return 'Needs Review';
    case 'DRAFT':
    case 'SUBMITTED':
    default:
      return 'Pending';
  }
};

const toUiExpense = (
  exp: ApiExpense,
  categoryNameById: Map<string, string>,
  vendorById: Map<string, Vendor>,
): Expense => {
  const vendor = exp.vendorId ? vendorById.get(exp.vendorId) : undefined;
  return {
    id: exp.id,
    orgId: exp.organizationId,
    date: exp.expenseDate,
    category: (categoryNameById.get(exp.categoryId) || 'Miscellaneous') as Expense['category'],
    vendorName: exp.vendorNameSnapshot || vendor?.name,
    vendorGstin: exp.vendorGstinSnapshot || vendor?.gstin || '',
    description: exp.items?.[0]?.description || '',
    amount: Number(exp.grandTotal),
    taxableAmount: Number(exp.subtotal),
    gstAmount: Number(exp.taxTotal),
    gstRate: Number(exp.items?.[0]?.taxRate ?? 0),
    tdsDeducted: exp.tdsAmount != null ? Number(exp.tdsAmount) : undefined,
    status: toUiExpenseStatus(exp.status),
  };
};

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
  unreadCount: number;
  documents: DocumentExtraction[];

  // NOTE: no invoice mutations here — SalesView and InvoiceCreationFlow use
  // the invoicesSlice thunks directly (create/finalize/cancel/update/delete),
  // so every invoice operation flows through dispatch().

  addTransaction: (transaction: Omit<Transaction, 'id' | 'orgId'>) => Transaction;

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
  TRANSACTIONS: 'ai_acc_transactions',
  BANK_ACCOUNTS: 'ai_acc_banks',
  BANK_FEEDS: 'ai_acc_feeds',
  BANK_STMT_LINES: 'ai_acc_stmt_lines',
  REVIEW_ITEMS: 'ai_acc_review',
  AUDIT_LOGS: 'ai_acc_audit',
  DOCUMENTS: 'ai_acc_docs',
};

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication is owned by Redux/Supabase; this remains for existing business display/audit consumers.
  const currentUser = useAppSelector(selectCurrentUser);

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

  // Expenses come from the backend via the expenses Redux slice
  // (GET /api/v1/expenses). Like invoices, the fetch must wait for an active
  // organization (TenantAccessGuard rejects headerless requests) and re-runs
  // when the tenant switches. Category + vendor display names are resolved
  // from the categories/vendors slices because the backend only returns ids.
  const expensesState = useAppSelector((state) => state.expenses);
  const categoriesState = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (activeOrganizationId) {
      void dispatch(fetchCategoriesThunk({ page: 1, limit: 100 }));
    }
  }, [activeOrganizationId, dispatch]);

  useEffect(() => {
    if (activeOrganizationId) {
      void dispatch(fetchExpensesThunk());
    }
  }, [activeOrganizationId, dispatch]);

  // Fetch notifications when organization changes
  useEffect(() => {
    if (activeOrganizationId && currentUser) {
      void dispatch(fetchNotifications({ organizationId: activeOrganizationId, userId: currentUser.id }));
      void dispatch(fetchUnreadCount({ organizationId: activeOrganizationId, userId: currentUser.id }));
    }
  }, [activeOrganizationId, currentUser, dispatch]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoriesState.list.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categoriesState.list]);

  const vendorById = useMemo(() => {
    const map = new Map<string, Vendor>();
    vendors.forEach((v) => map.set(v.id, v));
    return map;
  }, [vendors]);

  const expenses = useMemo<Expense[]>(
    () => expensesState.items.map((e) => toUiExpense(e, categoryNameById, vendorById)),
    [expensesState.items, categoryNameById, vendorById],
  );

  // Purchase bills are backend-owned (GET /bills). The provider only reads
  // their ITC totals for the shared GST input-credit metric; the bills
  // themselves are rendered by PurchasesView directly from the purchases slice.
  const purchasesState = useAppSelector((state) => state.purchases);
  const notificationsState = useAppSelector((state) => state.notifications);
  const unreadCountState = useAppSelector((state) => state.notifications.unreadCount);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
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

  
  const [documents, setDocuments] = useState<DocumentExtraction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : SAMPLE_DOCUMENTS;
  });

  // Save changes to localStorage for persistence. Invoices are backend-
  // owned now and no longer persisted locally.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

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
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  const addAuditEntry = (action: string, module: string, recordRef: string) => {
    const newEntry: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      orgId: currentOrg?.id || '',
      timestamp: new Date().toISOString(),
      user: currentUser?.name || '',
      userEmail: currentUser?.email || '',
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

    // NOTE: the old mock flow also created a local expense via addExpense()
    // here. Expenses are backend-owned now (GET/POST /api/v1/expenses), so
    // the OCR document-approval mock no longer fabricates expense records.

    addAuditEntry('Document OCR Action', 'AI Assistant', `${action} extracted document: ${doc.fileName}`);
  };

  const markNotificationRead = (id: string) => {
    // Dispatch the mark notification as read thunk
    // Note: We need organizationId and userId for the thunk
    // For now, we'll get them from Redux state or fallback to defaults
    // In a real implementation, these would come from the current context
    const userId = currentUser?.id || 'user_placeholder';
    const orgId = activeOrganizationId || 'org_placeholder';
    if (userId && orgId) {
      dispatch(markNotificationRead({ organizationId: orgId, userId: userId, notificationId: id }));
    }
  };

  const markAllNotificationsRead = () => {
    // Dispatch the mark all notifications as read thunk
    // Note: We need organizationId and userId for the thunk
    // For now, we'll get them from Redux state or fallback to defaults
    // In a real implementation, these would come from the current context
    const userId = currentUser?.id || 'user_placeholder';
    const orgId = activeOrganizationId || 'org_placeholder';
    if (userId && orgId) {
      dispatch(markAllNotificationsRead({ organizationId: orgId, userId: userId }));
    }
  };

  // Tenant Scoped Data Slices
  const activeOrgId = currentOrg?.id || 'unassigned';

  const orgInvoices = invoices.filter((i) => (i.orgId || 'org_acme') === activeOrgId);
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
  const orgNotifications = notificationsState.items.filter((n) => (n.orgId || 'org_acme') === activeOrgId || !n.orgId);
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
  const gstInputCredit = orgExpenses.reduce((sum, e) => sum + e.gstAmount, 0) + purchasesState.items.reduce((sum, p) => sum + Number(p.itcClaimedAmount), 0);
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
        unreadCount: unreadCountState,
        documents: orgDocuments,

        addTransaction,
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
