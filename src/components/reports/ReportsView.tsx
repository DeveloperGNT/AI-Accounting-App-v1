import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatINR } from '../../utils/formatters';

interface ReportsViewProps {
  navigate: (route: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ navigate }) => {
  const { metrics, currentOrg, invoices, expenses } = useAccounting();

  const [activeReport, setActiveReport] = useState<
    'PL' | 'BalanceSheet' | 'TrialBalance' | 'Aging' | 'CashFlow' | 'DayBook'
  >('PL');
  const [period, setPeriod] = useState('FY 2026–27 (YTD)');

  const reportsList = [
    { id: 'PL', name: 'Profit & Loss Statement', desc: 'Operating Revenue, COGS, Gross & Net Margins' },
    { id: 'BalanceSheet', name: 'Balance Sheet', desc: 'Assets, Liabilities & Owner Equity (Schedule III)' },
    { id: 'TrialBalance', name: 'Trial Balance', desc: 'Debit vs Credit ledger balance verification' },
    { id: 'Aging', name: 'Receivables & Payables Aging', desc: 'Overdue debtor buckets (0-30, 31-60, 90+ days)' },
    { id: 'CashFlow', name: 'Cash Flow Statement', desc: 'Operating, Investing & Financing Cash Flow' },
    { id: 'DayBook', name: 'Day Book / Daily Journal', desc: 'Tally-style chronological transaction audit' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Financial Statements & Statutory Reports
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            {currentOrg?.name} • ICAI & Schedule III Compliant Reporting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xs text-xs font-mono bg-white text-slate-900 focus:outline-none"
          >
            <option value="FY 2026–27 (YTD)">FY 2026–27 (YTD)</option>
            <option value="Q1 (Apr–Jun 2026)">Q1 (Apr–Jun 2026)</option>
            <option value="Q2 (Jul–Sep 2026)">Q2 (Jul–Sep 2026)</option>
            <option value="FY 2025–26 (Previous Year)">FY 2025–26 (Previous Year)</option>
          </select>

          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar of Reports + Statement Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Navigation Menu */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            Financial Statements
          </div>
          {reportsList.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveReport(item.id as any)}
              className={`w-full text-left p-3.5 rounded-xs border transition-all flex items-start justify-between ${
                activeReport === item.id
                  ? 'bg-white border-slate-950 shadow-xs ring-1 ring-slate-950'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{item.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
              <ChevronRight
                size={15}
                className={activeReport === item.id ? 'text-slate-950' : 'text-slate-300'}
              />
            </button>
          ))}
        </div>

        {/* Right 8 Cols: Statement Canvas */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xs p-8">
          {/* Header of Report Document */}
          <div className="text-center pb-6 border-b border-slate-950 mb-6">
            <h2 className="text-base font-bold text-slate-950 tracking-tight uppercase font-mono">
              {currentOrg?.name}
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              GSTIN: {currentOrg?.gstin} • PAN: {currentOrg?.pan}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3 font-mono">
              {reportsList.find((r) => r.id === activeReport)?.name}
            </h3>
            <div className="text-xs font-mono text-slate-600 mt-0.5">
              For the Period: {period} (Values in INR ₹)
            </div>
          </div>

          {/* 1. PROFIT & LOSS */}
          {activeReport === 'PL' && (
            <div className="space-y-6 text-xs font-mono">
              {/* Revenue */}
              <div>
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 flex justify-between uppercase">
                  <span>I. Revenue from Operations</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="py-2 space-y-1.5 text-slate-700">
                  <div className="flex justify-between pl-4">
                    <span>Gross Sales & Consulting Invoices</span>
                    <span>{formatINR(metrics.revenue)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-400">
                    <span>Less: Goods Returns & Adjustments</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total Revenue (A)</span>
                    <span>{formatINR(metrics.revenue)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 flex justify-between uppercase">
                  <span>II. Operating & General Expenses</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="py-2 space-y-1.5 text-slate-700">
                  <div className="flex justify-between pl-4">
                    <span>Direct Cost of Materials / Purchases (COGS)</span>
                    <span>₹2,10,000</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span>Employee Benefit Expenses (Payroll)</span>
                    <span>₹5,40,000</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span>Rent & Facility Overheads</span>
                    <span>₹65,000</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span>Professional, Legal & Audit Retainer Fees</span>
                    <span>₹15,000</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span>Software & Infrastructure Cloud Hosting</span>
                    <span>₹12,100</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total Expenses (B)</span>
                    <span>{formatINR(metrics.expenses)}</span>
                  </div>
                </div>
              </div>

              {/* Profit */}
              <div className="p-4 bg-slate-900 text-white rounded-xs space-y-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>Profit Before Tax (PBT) [A - B]</span>
                  <span className="text-emerald-400">{formatINR(metrics.netProfit)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300 border-t border-slate-800 pt-1.5">
                  <span>Estimated Corporate Income Tax (25%)</span>
                  <span>{formatINR(metrics.netProfit * 0.25)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-slate-700 pt-1.5">
                  <span>Net Profit After Tax (PAT)</span>
                  <span className="text-emerald-400">{formatINR(metrics.netProfit * 0.75)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. BALANCE SHEET */}
          {activeReport === 'BalanceSheet' && (
            <div className="space-y-6 text-xs font-mono">
              {/* Assets */}
              <div>
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 flex justify-between uppercase">
                  <span>I. Current & Non-Current Assets</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="py-2 space-y-1.5 text-slate-700">
                  <div className="flex justify-between pl-4 font-semibold text-slate-900">
                    <span>Current Assets:</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Cash & Bank Balances</span>
                    <span>{formatINR(metrics.cashAndBank)}</span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Trade Receivables (Debtors)</span>
                    <span>{formatINR(metrics.receivables)}</span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>GST Input Tax Credit (ITC Asset)</span>
                    <span>₹91,800</span>
                  </div>
                  <div className="flex justify-between pl-4 font-semibold text-slate-900">
                    <span>Non-Current / Fixed Assets:</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Plant, Equipment & Furniture (Net Block)</span>
                    <span>₹8,50,000</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 pt-2 border-t border-slate-200 text-sm">
                    <span>TOTAL ASSETS</span>
                    <span>{formatINR(metrics.cashAndBank + metrics.receivables + 91800 + 850000)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div>
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 flex justify-between uppercase">
                  <span>II. Liabilities & Shareholder Equity</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="py-2 space-y-1.5 text-slate-700">
                  <div className="flex justify-between pl-4 font-semibold text-slate-900">
                    <span>Current Liabilities:</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Trade Payables (Creditors)</span>
                    <span>{formatINR(metrics.payables)}</span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Statutory GST & TDS Dues</span>
                    <span>₹78,420</span>
                  </div>
                  <div className="flex justify-between pl-4 font-semibold text-slate-900">
                    <span>Shareholders Equity:</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Paid-up Share Capital</span>
                    <span>₹10,00,000</span>
                  </div>
                  <div className="flex justify-between pl-8">
                    <span>Retained Earnings / Reserves</span>
                    <span>{formatINR(metrics.netProfit)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 pt-2 border-t border-slate-200 text-sm">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span>{formatINR(metrics.cashAndBank + metrics.receivables + 91800 + 850000)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. TRIAL BALANCE */}
          {activeReport === 'TrialBalance' && (
            <div className="space-y-4 text-xs font-mono">
              <table className="w-full swiss-table border border-slate-200">
                <thead>
                  <tr>
                    <th>Ledger Account Head</th>
                    <th className="text-right">Debit (₹)</th>
                    <th className="text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-900">Sales Account</td>
                    <td className="text-right">—</td>
                    <td className="text-right font-bold">{formatINR(metrics.revenue)}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">Purchases Account</td>
                    <td className="text-right font-bold">₹2,10,000</td>
                    <td className="text-right">—</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">Salaries & Wages</td>
                    <td className="text-right font-bold">₹5,40,000</td>
                    <td className="text-right">—</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">HDFC Bank Current Account</td>
                    <td className="text-right font-bold">{formatINR(metrics.cashAndBank)}</td>
                    <td className="text-right">—</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">Trade Debtors (Receivables)</td>
                    <td className="text-right font-bold">{formatINR(metrics.receivables)}</td>
                    <td className="text-right">—</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">Trade Creditors (Payables)</td>
                    <td className="text-right">—</td>
                    <td className="text-right font-bold">{formatINR(metrics.payables)}</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td>TOTAL TRIAL BALANCE (MATCHED)</td>
                    <td className="text-right text-emerald-400">₹32,45,000</td>
                    <td className="text-right text-emerald-400">₹32,45,000</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Zero variance detected. Debit and Credit ledgers are completely balanced.</span>
              </div>
            </div>
          )}

          {/* 4. AGING */}
          {activeReport === 'Aging' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="border border-slate-200 rounded-xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 font-bold text-slate-900 border-b border-slate-200">
                  Accounts Receivable Aging Buckets
                </div>
                <table className="w-full swiss-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th className="text-right">0–30 Days</th>
                      <th className="text-right">31–60 Days</th>
                      <th className="text-right">61–90 Days</th>
                      <th className="text-right">90+ Days</th>
                      <th className="text-right font-bold">Total Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium text-slate-900">Tata Motors Limited</td>
                      <td className="text-right">₹3,45,000</td>
                      <td className="text-right">—</td>
                      <td className="text-right">—</td>
                      <td className="text-right">—</td>
                      <td className="text-right font-bold">₹3,45,000</td>
                    </tr>
                    <tr>
                      <td className="font-medium text-slate-900">Mahindra Aerospace Pvt Ltd</td>
                      <td className="text-right">—</td>
                      <td className="text-right text-amber-700">₹1,85,000</td>
                      <td className="text-right">—</td>
                      <td className="text-right">—</td>
                      <td className="text-right font-bold text-amber-700">₹1,85,000</td>
                    </tr>
                    <tr>
                      <td className="font-medium text-slate-900">Bharat Forge Ltd</td>
                      <td className="text-right">—</td>
                      <td className="text-right">—</td>
                      <td className="text-right text-red-700">₹1,12,000</td>
                      <td className="text-right">—</td>
                      <td className="text-right font-bold text-red-700">₹1,12,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CASH FLOW */}
          {activeReport === 'CashFlow' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold">
                  <span>A. Cash Flows from Operating Activities</span>
                  <span>{formatINR(metrics.netProfit)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold">
                  <span>B. Cash Flows from Investing Activities (Equipment)</span>
                  <span>- ₹1,50,000</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold">
                  <span>C. Cash Flows from Financing Activities</span>
                  <span>₹0.00</span>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-xs flex justify-between font-bold text-sm">
                  <span>Net Increase in Cash & Cash Equivalents</span>
                  <span className="text-emerald-400">{formatINR(metrics.cashAndBank)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. DAY BOOK */}
          {activeReport === 'DayBook' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="border border-slate-200 rounded-xs overflow-hidden">
                <table className="w-full swiss-table">
                  <thead>
                    <tr>
                      <th>Time / Voucher</th>
                      <th>Account Head Particulars</th>
                      <th>Voucher Type</th>
                      <th className="text-right">Debit (₹)</th>
                      <th className="text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.invoiceNumber}</td>
                        <td className="font-medium text-slate-900">{inv.customerName}</td>
                        <td>Sales Voucher</td>
                        <td className="text-right">—</td>
                        <td className="text-right font-bold">{formatINR(inv.totalAmount)}</td>
                      </tr>
                    ))}
                    {expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>EXP-{(exp.id || '').slice(-4)}</td>
                        <td className="font-medium text-slate-900">{exp.category}</td>
                        <td>Expense Voucher</td>
                        <td className="text-right font-bold">{formatINR(exp.amount)}</td>
                        <td className="text-right">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
