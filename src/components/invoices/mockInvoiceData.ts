import {
  InvoiceTemplateMeta,
  InvoiceFormData,
  InvoiceCalculations,
  InvoiceItemForm,
  InvoiceTemplateId,
} from './types';
import { numberToWordsIndian } from '../../utils/formatters';

export const INVOICE_TEMPLATES: InvoiceTemplateMeta[] = [
  {
    id: 'classic',
    number: 'T1',
    name: 'Classic Tax Invoice',
    tagline: 'Traditional & Formal GST Layout',
    badge: 'Standard / CA Preferred',
    description:
      'Traditional structured grid with side-by-side Buyer & Seller details, complete HSN & CGST/SGST/IGST breakdown schedule, bank details, and formal seal box.',
    accentColor: '#1e293b',
    recommendedFor: 'Manufacturing, Trading, Standard GST Invoicing & B2B Tax Filings',
  },
  {
    id: 'modern',
    number: 'T2',
    name: 'Modern Minimal',
    tagline: 'Clean & Contemporary Visual Hierarchy',
    badge: 'Most Popular',
    description:
      'Contemporary SaaS layout with charcoal hero header, floating item rows, prominent grand total highlight box, payment badge, and payment QR placeholder.',
    accentColor: '#0f172a',
    recommendedFor: 'IT Services, Agencies, Consultancies & Modern Digital Businesses',
  },
  {
    id: 'minimal',
    number: 'T3',
    name: 'Minimal Swiss',
    tagline: 'Stark Typography & Grid Readability',
    badge: 'High Clarity',
    description:
      'Understated Swiss-inspired composition with razor-thin dividing rules, monospaced numeric columns, spacious padding, and zero visual clutter.',
    accentColor: '#171717',
    recommendedFor: 'Design Studios, Architecture Firms, Legal & High-End Advisory',
  },
  {
    id: 'corporate',
    number: 'T4',
    name: 'Corporate Executive',
    tagline: 'Dual-Tone Header & Formal Schedules',
    badge: 'Executive',
    description:
      'Premium corporate header band with tax schedule summary block, clear payment milestone terms, dual-signatory verification container, and PO cross-referencing.',
    accentColor: '#09090b',
    recommendedFor: 'Enterprises, Infrastructure Contracts & Government Suppliers',
  },
];

export const INITIAL_MOCK_ITEMS: InvoiceItemForm[] = [
  {
    id: 'item_1',
    description: 'Precision CNC Aluminum Component Assembly (Grade 6061-T6)',
    hsn: '846693',
    quantity: 12,
    unit: 'PCS',
    rate: 4500,
    discountPct: 5,
    gstRate: 18,
    amount: 51300,
    cgst: 4617,
    sgst: 4617,
    igst: 0,
    total: 60534,
  },
  {
    id: 'item_2',
    description: 'Industrial Hydraulic Seals & Pressure Gaskets (High Temp)',
    hsn: '848410',
    quantity: 40,
    unit: 'SETS',
    rate: 650,
    discountPct: 0,
    gstRate: 18,
    amount: 26000,
    cgst: 2340,
    sgst: 2340,
    igst: 0,
    total: 30680,
  },
  {
    id: 'item_3',
    description: 'Annual Preventive Machine Calibration & Quality Certification',
    hsn: '998719',
    quantity: 1,
    unit: 'JOB',
    rate: 15000,
    discountPct: 10,
    gstRate: 18,
    amount: 13500,
    cgst: 1215,
    sgst: 1215,
    igst: 0,
    total: 15930,
  },
];

export const INITIAL_MOCK_INVOICE: InvoiceFormData = {
  templateId: 'classic',
  business: {
    name: 'ACME INDUSTRIES PVT LTD',
    tradeName: 'Acme Industrial Solutions',
    gstin: '27AABCA1234F1Z5',
    pan: 'AABCA1234F',
    address: 'Plot 42, MIDC Industrial Area, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra (27)',
    pincode: '400093',
    email: 'billing@acmeindustries.in',
    phone: '+91 22 4589 0000',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0000060',
    branch: 'MIDC Andheri East, Mumbai',
    upiId: 'acmeindustries@hdfcbank',
  },
  customer: {
    name: 'XYZ Private Limited',
    tradeName: 'XYZ Enterprise Systems',
    gstin: '27AABCP8890K1ZV',
    pan: 'AABCP8890K',
    billingAddress: 'Tower 3, World Trade Centre, Cuffe Parade',
    shippingAddress: 'Plant 2, Khopoli Industrial Estate, Raigad, Maharashtra - 410203',
    city: 'Mumbai',
    state: 'Maharashtra (27)',
    pincode: '400005',
    email: 'procurement@xyzpvt.com',
    phone: '+91 98201 44552',
    contactPerson: 'Rajesh Kulkarni (Head of Procurement)',
    placeOfSupply: 'Maharashtra (27)',
  },
  metadata: {
    invoiceNumber: 'INV/2026-27/0412',
    invoiceDate: '2026-08-27',
    dueDate: '2026-09-26',
    poNumber: 'PO-XYZ-2026-891',
    paymentTerms: 'Net 30 Days',
    reverseCharge: false,
    isInterstate: false,
  },
  items: INITIAL_MOCK_ITEMS,
  additionalDiscount: 0,
  shippingCharges: 1500,
  notes:
    'Goods once sold will not be taken back without prior authorization. Warranty 12 months from delivery.',
  termsAndConditions:
    '1. Payment must be made within 30 days of invoice date.\n2. Interest @ 18% p.a. will be levied on overdue payments.\n3. Subject to Mumbai Jurisdiction only.\n4. Certified that the particulars given above are true and correct.',
  authorizedSignatory: 'Authorized Signatory',
  signatoryTitle: 'Authorized Signatory / Finance Director',
};

// Preset Mock Samples for 1-Click Loading
export interface InvoicePresetSample {
  name: string;
  category: string;
  description: string;
  data: Partial<InvoiceFormData>;
}

export const INVOICE_PRESET_SAMPLES: InvoicePresetSample[] = [
  {
    name: 'Manufacturing & Heavy Spares',
    category: 'Manufacturing',
    description: 'Industrial goods, B2B manufacturing items with HSN codes & shipping',
    data: INITIAL_MOCK_INVOICE,
  },
  {
    name: 'IT Services & Cloud Advisory',
    category: 'Technology',
    description: 'Software development, AWS Cloud hosting & UI/UX retainers with SAC 9983',
    data: {
      customer: {
        name: 'FinTech Global Software Inc',
        tradeName: 'FinTech Cloud Labs',
        gstin: '29AAACG8811K1Z2',
        pan: 'AAACG8811K',
        billingAddress: '4th Floor, Indiranagar 100ft Road, Stage 2',
        city: 'Bengaluru',
        state: 'Karnataka (29)',
        pincode: '560038',
        email: 'accounts@fintechglobal.com',
        phone: '+91 80 4455 6677',
        contactPerson: 'Kavita Menon',
        placeOfSupply: 'Karnataka (29)',
      },
      metadata: {
        invoiceNumber: 'INV/2026-27/0889',
        invoiceDate: '2026-08-27',
        dueDate: '2026-09-11',
        poNumber: 'PO-FTG-CLOUD-44',
        paymentTerms: 'Net 15 Days',
        reverseCharge: false,
        isInterstate: true, // Maharashtra to Karnataka = IGST
      },
      items: [
        {
          id: 'item_it_1',
          description: 'Enterprise Cloud Architecture & Security Audit (Sprint 12)',
          hsn: '998313',
          quantity: 80,
          unit: 'HRS',
          rate: 2500,
          discountPct: 0,
          gstRate: 18,
          amount: 200000,
          cgst: 0,
          sgst: 0,
          igst: 36000,
          total: 236000,
        },
        {
          id: 'item_it_2',
          description: 'Dedicated Frontend Engineering (React / TypeScript Microservices)',
          hsn: '998314',
          quantity: 1,
          unit: 'MONTH',
          rate: 175000,
          discountPct: 5,
          gstRate: 18,
          amount: 166250,
          cgst: 0,
          sgst: 0,
          igst: 29925,
          total: 196175,
        },
        {
          id: 'item_it_3',
          description: 'Managed Kubernetes Cluster Infrastructure Maintenance',
          hsn: '998315',
          quantity: 1,
          unit: 'SUB',
          rate: 45000,
          discountPct: 0,
          gstRate: 18,
          amount: 45000,
          cgst: 0,
          sgst: 0,
          igst: 8100,
          total: 53100,
        },
      ],
      shippingCharges: 0,
      additionalDiscount: 5000,
      notes: 'Payment via Wire / NEFT. Please quote invoice number in payment description.',
    },
  },
  {
    name: 'Wholesale Electronics & Hardware',
    category: 'Trading',
    description: 'Consumer electronics, GST 18% & 28% mixed goods with intra-state supply',
    data: {
      customer: {
        name: 'Reliance Logistics & Infra',
        tradeName: 'RLI Infrastructure Hub',
        gstin: '24AABCR2341M1ZX',
        pan: 'AABCR2341M',
        billingAddress: 'Sector 11, Gandhinagar Industrial Hub',
        city: 'Gandhinagar',
        state: 'Gujarat (24)',
        pincode: '382010',
        email: 'sunil.mehta@rli-infra.com',
        phone: '+91 99099 12345',
        contactPerson: 'Sunil Mehta',
        placeOfSupply: 'Gujarat (24)',
      },
      metadata: {
        invoiceNumber: 'INV/2026-27/1004',
        invoiceDate: '2026-08-27',
        dueDate: '2026-10-11',
        poNumber: 'RLI/PO/AUG/098',
        paymentTerms: 'Net 45 Days',
        reverseCharge: false,
        isInterstate: true,
      },
      items: [
        {
          id: 'item_el_1',
          description: 'Industrial Smart Power Meters with RS485 Modbus Output',
          hsn: '902830',
          quantity: 25,
          unit: 'NOS',
          rate: 3200,
          discountPct: 8,
          gstRate: 18,
          amount: 73600,
          cgst: 0,
          sgst: 0,
          igst: 13248,
          total: 86848,
        },
        {
          id: 'item_el_2',
          description: 'Optically Isolated Serial Hubs (8-Port DIN Rail Mounted)',
          hsn: '851762',
          quantity: 10,
          unit: 'NOS',
          rate: 6800,
          discountPct: 5,
          gstRate: 18,
          amount: 64600,
          cgst: 0,
          sgst: 0,
          igst: 11628,
          total: 76228,
        },
      ],
      shippingCharges: 2200,
      additionalDiscount: 1000,
    },
  },
];

export function recalculateInvoice(data: InvoiceFormData): InvoiceCalculations {
  let subtotal = 0;
  let itemDiscounts = 0;
  let taxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const isInterstate = data.metadata.isInterstate;

  data.items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discountPct) || 0;
    const gstRate = Number(item.gstRate) || 0;

    const base = qty * rate;
    const lineDiscount = (base * discount) / 100;
    const taxable = base - lineDiscount;

    subtotal += base;
    itemDiscounts += lineDiscount;
    taxableAmount += taxable;

    if (isInterstate) {
      const igst = (taxable * gstRate) / 100;
      totalIgst += igst;
    } else {
      const tax = (taxable * gstRate) / 100;
      totalCgst += tax / 2;
      totalSgst += tax / 2;
    }
  });

  const additionalDiscount = Number(data.additionalDiscount) || 0;
  const shippingCharges = Number(data.shippingCharges) || 0;

  const totalTax = totalCgst + totalSgst + totalIgst;
  const rawTotal = Math.max(0, taxableAmount - additionalDiscount + shippingCharges + totalTax);
  const roundedGrandTotal = Math.round(rawTotal);
  const roundOff = Math.round((roundedGrandTotal - rawTotal) * 100) / 100;

  const amountInWords = numberToWordsIndian(roundedGrandTotal);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemDiscounts: Math.round(itemDiscounts * 100) / 100,
    additionalDiscount,
    shippingCharges,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    rawTotal: Math.round(rawTotal * 100) / 100,
    roundOff,
    grandTotal: roundedGrandTotal,
    amountInWords,
  };
}
