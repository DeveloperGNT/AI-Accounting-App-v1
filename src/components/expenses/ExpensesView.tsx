import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingDown,
  Receipt,
  FileText
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchCategories } from '../../features/categories/categoriesSlice';
import { fetchAccounts } from '../../features/accounts/accountsSlice';
import { formatINR, formatDate } from '../../utils/formatters';
import { Expense, ExpenseCategory, PaymentMode } from '../../types';

interface ExpensesViewProps {
  navigate: (route: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ navigate }) => {
  const { expenses, addExpense, currentOrg } = useAccounting();
  const dispatch = useAppDispatch();
  const categoriesState = useAppSelector((state) => state.categories);
  const accountsState = useAppSelector((state) => state.accounts);

  // Backend-driven master data: categories from GET /categories and ledger
  // accounts from GET /accounts. The hardcoded fallbacks keep the UI usable
  // while the lists are loading or when the API returns no rows yet.
  useEffect(() => {
    dispatch(fetchCategories({ page: 1, limit: 100 }));
    dispatch(fetchAccounts());
  }, [dispatch]);

  const apiCategoryNames = (categoriesState.list ?? [])
    .filter((c) => (c.type ?? '').toUpperCase() !== 'INCOME')
    .map((c) => c.name);
  const apiAccountOptions = accountsState.items
    .filter((a: any) => (a.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE')
    .map((a: any) => ({ label: a.code ? `${a.name} (${a.code})` : a.name, name: a.name as string }));

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form State
  const [date, setDate] = useState('2026-08-08');
  const [category, setCategory] = useState<ExpenseCategory>('Rent & Facilities');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [amount, setAmount] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer (NEFT/RTGS)');
  const [account, setAccount] = useState('HDFC Current A/c (0060)');
  const [tdsDeducted, setTdsDeducted] = useState(false);
  const [tdsRate, setTdsRate] = useState('10'); // 10% for professional fees (194J)

  const fallbackCategories: ExpenseCategory[] = [
    'Rent & Facilities',
    'Electricity & Utilities',
    'Salaries & Wages',
    'Professional & Legal Fees',
    'Travel & Conveyance',
    'Software & Subscriptions',
    'Marketing & Advertising',
    'Office Supplies & Stationary',
    'Repairs & Maintenance',
    'Freight & Logistics',
    'Bank Charges',
    'Miscellaneous',
  ];

  const fallbackAccounts = [
    { label: 'HDFC Current A/c (0060)', name: 'HDFC Current A/c (0060)' },
    { label: 'ICICI Bank Operating A/c', name: 'ICICI Bank Operating A/c' },
    { label: 'Cash on Hand (Petty Cash)', name: 'Cash on Hand (Petty Cash)' },
  ];

  const categoryOptions = Array.from(new Set([...apiCategoryNames, ...fallbackCategories]));
  const accountOptions = Array.from(
    new Map([...fallbackAccounts, ...apiAccountOptions].map((a) => [a.name, a])).values(),
  );

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        (e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(amount) || 0;
    const gRate = parseFloat(gstRate) || 0;
    const taxable = gross / (1 + gRate / 100);
    const gstVal = gross - taxable;

    let tdsVal = 0;
    if (tdsDeducted) {
      tdsVal = (taxable * (parseFloat(tdsRate) || 0)) / 100;
    }

    addExpense({
      date,
      category,
      description,
      vendorName: vendorName || undefined,
      vendorGstin: vendorGstin || undefined,
      taxableAmount: Math.round(taxable),
      gstAmount: Math.round(gstVal),
      gstRate: gRate,
      amount: gross,
      paymentMode,
      account,
      tdsDeducted: tdsDeducted ? Math.round(tdsVal) : undefined,
      status: 'Paid',
    });

    setIsModalOpen(false);
    setDescription('');
    setVendorName('');
    setAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Operating & Administrative Expenses
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Track business overheads, operational costs, TDS withholdings, and payment accounts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          id="record-expense-btn"
          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xs flex items-center gap-2 transition-colors"
        >
          <Plus size={14} />
          <span>Record Business Expense</span>
        </button>
      </div>

      {/* Expense Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xs">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Total Operational Outflow
          </div>
          <div className="text-xl font-bold font-mono text-slate-950 mt-1.5">
            {formatINR(totalExpenseAmount, false)}
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-500">
            {expenses.length} voucher records
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xs">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Payroll & Retainers
          </div>
          <div className="text-xl font-bold font-mono text-slate-950 mt-1.5">
            ₹5,40,000
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-500">
            64.1% of monthly OpEx
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xs">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            GST ITC on Expenses
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1.5">
            ₹45,900
          </div>
          <div className="mt-1 text-[10px] font-mono text-emerald-700">
            Eligible Input Tax Credit
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xs">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            TDS Withheld (Payable)
          </div>
          <div className="text-xl font-bold font-mono text-slate-950 mt-1.5">
            ₹15,000
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-500">
            Due by 7th next month
          </div>
        </div>
      </div>

      {/* Filter Category & Search */}
      <div className="bg-white border border-slate-200 rounded-xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 relative max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by vendor or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xs bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Expense Heads</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(categoriesState.listStatus === 'loading' || accountsState.status === 'loading') && (
          <div className="text-[10px] font-mono text-slate-500">
            Loading categories & ledger accounts from server…
          </div>
        )}
        {(categoriesState.listStatus === 'failed' || accountsState.status === 'failed') && (
          <div className="text-[10px] font-mono text-red-600">
            Could not load latest categories or accounts
            {categoriesState.error?.message || accountsState.error
              ? ` (${categoriesState.error?.message ?? accountsState.error})`
              : ''}
            — using built-in defaults.
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left swiss-table border-collapse">
            <thead>
              <tr>
                <th className="w-24">Date</th>
                <th>Expense Head / Category</th>
                <th>Description</th>
                <th>Vendor / Payee</th>
                <th>Payment Mode & A/c</th>
                <th className="text-right w-24">GST Tax</th>
                <th className="text-right w-28">Amount</th>
                <th className="text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="font-mono text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(exp.date)}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 rounded-xs">
                      {exp.category}
                    </span>
                  </td>
                  <td className="font-medium text-slate-900 text-xs">
                    {exp.description}
                  </td>
                  <td className="text-slate-700 text-xs">
                    <div>{exp.vendorName || 'Direct Payment'}</div>
                    {exp.vendorGstin && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        GSTIN: {exp.vendorGstin}
                      </div>
                    )}
                  </td>
                  <td className="text-xs text-slate-600 font-mono">
                    <div>{exp.account}</div>
                    <div className="text-[10px] text-slate-400">{exp.paymentMode}</div>
                  </td>
                  <td className="text-right font-mono text-slate-600 whitespace-nowrap text-xs">
                    {exp.gstAmount > 0 ? formatINR(exp.gstAmount) : '—'}
                  </td>
                  <td className="text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-xs font-semibold bg-emerald-100 text-emerald-900">
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-xs shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950 tracking-tight">
                  Record Business Expense Voucher
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  General administrative and operational payment
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xs hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Expense Head / Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900 bg-white"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description / Narration *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly server hosting fees for ERP infrastructure"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Vendor / Payee Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services India"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Vendor GSTIN (For ITC Claim)
                  </label>
                  <input
                    type="text"
                    placeholder="27AAACH1234F1Z1"
                    value={vendorGstin}
                    onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono uppercase focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Total Expense Amount (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    GST Rate
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="0">0% (Nil / Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Payment Account
                  </label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900 bg-white"
                  >
                    {accountOptions.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xs hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-xs font-semibold"
                >
                  Post Expense to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
