// Mirrors ai-accounting-app-be/src/modules/payments vendor-payment files
// (vendor-payments.controller.ts, dto/create-vendor-payment.dto.ts,
// entities/vendor-payment.entity.ts).
// The controller is @Controller('vendor-payments') with NO hardcoded api/v1,
// so the served route is the single global prefix /api/v1/vendor-payments —
// the apiClient baseURL ('/api/v1') + relative '/vendor-payments' is correct.
export enum VendorPaymentStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED',
}

export interface VendorPayment {
  id: string;
  organizationId: string;
  vendorId?: string | null;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  referenceNumber?: string;
  status: VendorPaymentStatus;
  journalEntryId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  expenseId?: string | null;
}

// CreateVendorPaymentDto: only `amount` is required; vendorId/expenseId are
// optional UUIDs, paymentDate defaults to today server-side.
export interface CreateVendorPaymentDto {
  vendorId?: string;
  expenseId?: string;
  amount: number;
  paymentDate?: string;
  referenceNumber?: string;
}

// The post endpoint takes the paying (bank/cash) account in the body:
// @Post(':id/post') with @Body('paymentAccountId').
export interface PostVendorPaymentDto {
  paymentAccountId: string;
}
