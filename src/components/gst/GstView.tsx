import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  FileText,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchGstOutwardSupply,
  fetchGstInwardSupply,
  fetchGstSummary,
} from '../../features/gst/gstSlice';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import { useAccounting } from '../../context/AccountingContext';
import { formatINR, formatDate } from '../../utils/formatters';
import type { GstTransaction } from '../../api/gstTypes';

interface GstViewProps {
  navigate: (route: string) => void;
}

// Return period options — each maps to a calendar month used for the
// startDate/endDate query params sent to the backend GST report endpoints.
const PERIODS = [
  { id: '2026-07', label: 'July 2026', start: '2026-07-01', end: '2026-07-31' },
  { id: '2026-06', label: 'June 2026', start: '2026-06-01', end: '2026-06-30' },
  { id: '2026-05', label: 'May 2026', start: '2026-05-01', end: '2026-05-31' },
];

export const GstView: React.FC<GstViewProps> = ({ navigate }) => {
  const dispatch = useAppDispatch();
  const { currentOrg } = useAccounting();
  const gst = useAppSelector((state) => state.gst);

  const [periodId, setPeriodId] = useState<string>('2026-07');
  const [refreshToken, setRefreshToken] = useState(0);

  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[0];
  const organizationId = useAppSelector(
    (state) => state.organizations.activeOrganizationId,
  );

  // Load all three GST reports when the view mounts, the period changes, the
  // active organization changes, or the user presses Refresh. organizationId
  // always comes from the active tenant in Redux — never hardcoded.
  useEffect(() => {
    if (!organizationId) return;
    const params = { startDate: period.start, endDate: period.end };
    dispatch(fetchGstOutwardSupply({ organizationId, params }));
    dispatch(fetchGstInwardSupply({ organizationId, params }));
    dispatch(fetchGstSummary({ organizationId, params }));
  }, [dispatch, organizationId, period.start, period.end, refreshToken]);

  const isLoading =
    gst.outwardStatus === 'loading' ||
    gst.inwardStatus === 'loading' ||
    gst.summaryStatus === 'loading';
  const hasError =
    gst.outwardStatus === 'failed' ||
    gst.inwardStatus === 'failed' ||
    gst.summaryStatus === 'failed';
  const isLoaded =
    gst.outwardStatus === 'succeeded' &&
    gst.inwardStatus === 'succeeded' &&
    gst.summaryStatus === 'succeeded';

  // Backend-computed figures (GET .../gst/reports/summary + registers)
  const liability = gst.summary?.liability;
  const itc = gst.summary?.itc;
  const net = gst.summary?.netLiability;
  const outwardTx = gst.outward?.transactions ?? [];
  const inwardTx = gst.inward?.transactions ?? [];

  const netPayable = useMemo(() => {
    if (!net) return 0;
    return Math.max(0, net.cgst + net.sgst + net.igst + net.cess);
  }, [net]);

  const handleExportJson = () => {
    const payload = {
      gstin: currentOrg?.gstin,
      fp: period.id.replace('-', ''),
      liability: liability ?? null,
      itc: itc ?? null,
      netLiability: net ?? null,
      b2b: outwardTx,
    };
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = `GSTR1_${currentOrg?.gstin || 'org'}_${period.id}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderTxTable = (transactions: GstTransaction[], outward: boolean) => (
    <div className="overflow-x-auto border border-slate-200 rounded-xs">
      <table className="w-full swiss-table">
        <thead>
          <tr>
            <th>Document Type</th>
            <th>Document Id</th>
            <th>Date</th>
            <th>Counterparty GSTIN</th>
            <th>Supply</th>
            <th className="text-right">Taxable Value</th>
            <th className="text-right">CGST</th>
            <th className="text-right">SGST</th>
            <th className="text-right">IGST</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-10 text-center text-slate-400 text-xs font-mono">
                No {outward ? 'outward' : 'inward'} supply transactions recorded for {period.label}.
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="font-mono text-[11px] font-bold text-slate-900">
                  {tx.sourceDocumentType}
                  {tx.isReversal && (
                    <span className="ml-1 text-red-700">(REVERSAL)</span>
                  )}
                </td>
                <td className="font-mono text-[10px] text-slate-500 max-w-[140px] truncate">
                  {tx.sourceDocumentId}
                </td>
                <td className="font-mono text-slate-600">{formatDate(tx.transactionDate)}</td>
                <td className="font-mono text-slate-700">{tx.counterpartyGstin || '—'}</td>
                <td className="font-mono text-[10px] text-slate-600">
                  {tx.supplyType === 'INTRA_STATE' ? 'Intra' : 'Inter'}
                </td>
                <td className="font-mono text-right">{formatINR(Number(tx.taxableAmount))}</td>
                <td className="font-mono text-right">{formatINR(Number(tx.cgstAmount))}</td>
                <td className="font-mono text-right">{formatINR(Number(tx.sgstAmount))}</td>
                <td className="font-mono text-right">{formatINR(Number(tx.igstAmount))}</td>
                <td className="font-mono text-right font-bold text-slate-950">
                  {formatINR(Number(tx.totalAmount))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">
              GST Compliance & Statutory Returns Hub
            </h1>
            {isLoaded && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 rounded-xs">
                Live Ledger Data
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            GSTIN: <span className="font-bold text-slate-900">{currentOrg?.gstin || '—'}</span> • State: {currentOrg?.state || '—'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xs text-xs font-mono bg-white text-slate-900 focus:outline-none"
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                Return Period: {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setRefreshToken((t) => t + 1)}
            disabled={isLoading || !organizationId}
            className="bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xs flex items-center gap-2 transition-colors"
            title="Re-fetch all GST reports from the backend"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportJson}
            id="export-gstr-json-btn"
            disabled={!isLoaded}
            className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xs flex items-center gap-2 transition-colors"
          >
            <Download size={14} />
            <span>Export GSTR-1 JSON</span>
          </button>
        </div>
      </div>

      {/* Loading banner */}
      {isLoading && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xs px-4 py-3 text-xs font-mono flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Loading GST registers from the ledger...
        </div>
      )}

      {/* API error banner */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xs px-4 py-3 flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} />
            GST report error: {getApiErrorMessage(gst.error, 'Could not load GST reports.')}
          </span>
          <button
            onClick={() => setRefreshToken((t) => t + 1)}
            className="font-semibold underline hover:no-underline whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tax Liability & ITC Metrics Grid — backend summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Output Liability */}
        <div className="bg-white border border-slate-200 p-5 rounded-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">
              Total Output Tax Liability
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-xs">
              Table 3.1 (a)
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">
            {formatINR(liability ? liability.totalCgst + liability.totalSgst + liability.totalIgst + liability.totalCess : 0)}
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>CGST (Central):</span>
              <span>{formatINR(liability?.totalCgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (State):</span>
              <span>{formatINR(liability?.totalSgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGST (Integrated):</span>
              <span>{formatINR(liability?.totalIgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span>{formatINR(liability?.totalTaxableValue ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Input Tax Credit */}
        <div className="bg-white border border-slate-200 p-5 rounded-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">
              Eligible Input Tax Credit (ITC)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs">
              Table 4 (A) (5)
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatINR(itc ? itc.totalCgst + itc.totalSgst + itc.totalIgst + itc.totalCess : 0)}
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>CGST Credit:</span>
              <span>{formatINR(itc?.totalCgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST Credit:</span>
              <span>{formatINR(itc?.totalSgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGST Credit:</span>
              <span>{formatINR(itc?.totalIgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span>{formatINR(itc?.totalTaxableValue ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Net GST Payable */}
        <div className="bg-white border border-slate-200 p-5 rounded-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">
                Net GST Cash Liability
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 text-white rounded-xs">
                GSTR-3B Table 6.1
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-950 mt-2">
              {formatINR(netPayable)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Period: <span className="font-bold text-slate-900">{period.label}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Net CGST:</span>
              <span>{formatINR(net?.cgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net SGST:</span>
              <span>{formatINR(net?.sgst ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net IGST:</span>
              <span>{formatINR(net?.igst ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outward Supply Register (GSTR-1 source) */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden">
        <div className="border-b border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Outward Supply Register — B2B Taxable Outward Supplies
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            GET /organizations/{'{orgId}'}/gst/reports/outward-supply
          </span>
        </div>
        <div className="p-6">
          {gst.outwardStatus === 'loading' ? (
            <div className="py-10 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading outward supply register...
            </div>
          ) : (
            renderTxTable(outwardTx, true)
          )}
        </div>
      </div>

      {/* Inward Supply Register (ITC source) */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden">
        <div className="border-b border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Inward Supply Register — Purchases &amp; Expenses (ITC)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            GET /organizations/{'{orgId}'}/gst/reports/inward-supply
          </span>
        </div>
        <div className="p-6">
          {gst.inwardStatus === 'loading' ? (
            <div className="py-10 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading inward supply register...
            </div>
          ) : (
            renderTxTable(inwardTx, false)
          )}
        </div>
      </div>
    </div>
  );
};
