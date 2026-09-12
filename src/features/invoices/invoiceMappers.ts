import type {
  Invoice as ApiInvoice,
  InvoiceItem as ApiInvoiceItem,
  CreateInvoiceDto,
} from '../../api/invoicesTypes';
import type { Invoice as UiInvoice, InvoiceItem as UiInvoiceItem } from '../../types';
import type { InvoiceFormData as InvoiceEditorForm } from '../../components/invoices/types';

// The backend stores one tax pool per line (taxAmount) plus taxRate, not the
// CGST/SGST/IGST split — that is derived at finalize time from GST config.
// Map the whole tax to IGST for display so totals (cgst+sgst+igst) stay exact.
const toUiInvoiceItem = (item: ApiInvoiceItem): UiInvoiceItem => {
  const taxable = Number(item.lineTotal) - Number(item.taxAmount);
  return {
    id: item.id,
    description: item.description,
    hsn: item.hsn ?? '',
    quantity: Number(item.quantity),
    unit: 'NOS',
    rate: Number(item.unitPrice),
    discountPct:
      Number(item.unitPrice) > 0
        ? Math.round((Number(item.discount) / (Number(item.quantity) * Number(item.unitPrice))) * 10000) / 100
        : 0,
    gstRate: Number(item.taxRate),
    amount: Math.round(taxable * 100) / 100,
    cgst: 0,
    sgst: 0,
    igst: Number(item.taxAmount),
  };
};

// Map an API invoice onto the legacy UI Invoice shape used by the context
// consumers (SalesView, dashboards, GST/report views, global search).
const toUiInvoice = (inv: ApiInvoice): UiInvoice => ({
  id: inv.id,
  orgId: inv.organizationId,
  invoiceNumber: inv.invoiceNumber,
  customerId: inv.customerId,
  customerName: inv.customerNameSnapshot,
  customerGstin: inv.customerGstinSnapshot ?? '',
  date: inv.invoiceDate,
  dueDate: inv.dueDate ?? '',
  items: (inv.items ?? []).map(toUiInvoiceItem),
  subtotal: Number(inv.grossSubtotal),
  discount: Number(inv.discountTotal),
  taxableAmount: Number(inv.taxableAmount),
  cgst: 0,
  sgst: 0,
  igst: Number(inv.taxTotal),
  totalAmount: Number(inv.grandTotal),
  amountPaid: 0,
  status: toUiStatus(inv.status),
  apiStatus: inv.status,
  notes: inv.notes,
  termsAndConditions: inv.terms,
  isInterState: true,
  templateId: 'classic',
});

export const toUiStatus = (status: ApiInvoice['status']): UiInvoice['status'] => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'FINALIZED':
      return 'Sent';
    case 'PARTIALLY_PAID':
      return 'Partially Paid';
    case 'PAID':
      return 'Paid';
    case 'CANCELLED':
      return 'Draft'; // UI has no CANCELLED status; cancelled invoices show as Draft-like
    default:
      return 'Draft';
  }
};

export { toUiInvoice };

// Build the create payload from the InvoiceEditor form (InvoiceCreationFlow).
// The backend recomputes all totals server-side; only raw line data is sent.
// items without a description are dropped (CreateInvoiceItemDto.description
// is @IsNotEmpty). Discount is sent as an absolute amount (unitPrice * qty *
// pct / 100) because CreateInvoiceItemDto.discount is a number, not a
// percentage.
export const toCreateInvoiceRequestFromForm = (
  formData: InvoiceEditorForm,
  customerId: string,
): CreateInvoiceDto => ({
  customerId,
  invoiceDate: formData.metadata.invoiceDate,
  dueDate: formData.metadata.dueDate || undefined,
  notes: formData.notes?.trim() ? formData.notes : undefined,
  terms: formData.termsAndConditions?.trim() ? formData.termsAndConditions : undefined,
  items: formData.items
    .filter((item) => item.description.trim())
    .map((item) => {
      const rate = Number(item.rate) || 0;
      const quantity = Number(item.quantity) || 0;
      return {
        description: item.description.trim(),
        quantity,
        unitPrice: rate,
        discount: Math.round(rate * quantity * ((Number(item.discountPct) || 0) / 100) * 100) / 100,
        taxRate: Number(item.gstRate) || 0,
      };
    }),
});

// Build the backend create payload from the UI invoice form. The backend
// recomputes all totals server-side; only raw line data is sent. Discount is
// sent as an absolute amount (unitPrice * qty * pct / 100) because
// CreateInvoiceItemDto.discount is a number, not a percentage.
export const toCreateInvoiceRequest = (invoice: Omit<UiInvoice, 'id' | 'orgId'>): CreateInvoiceDto => ({
  customerId: invoice.customerId,
  invoiceDate: invoice.date,
  dueDate: invoice.dueDate || undefined,
  notes: invoice.notes?.trim() ? invoice.notes : undefined,
  terms: invoice.termsAndConditions?.trim() ? invoice.termsAndConditions : undefined,
  items: invoice.items.map((item) => {
    const rate = Number(item.rate) || 0;
    const quantity = Number(item.quantity) || 0;
    return {
      description: (item.description || 'Line Item').trim(),
      quantity,
      unitPrice: rate,
      discount: Math.round(rate * quantity * ((Number(item.discountPct) || 0) / 100) * 100) / 100,
      taxRate: Number(item.gstRate) || 0,
    };
  }),
});
