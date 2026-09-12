// Mirrors ai-accounting-app-be/src/modules/payments (payment.entity.ts,
// payment-allocation.entity.ts, dto/create-payment.dto.ts).
// NOTE: the backend controller is @Controller('api/v1/payments') while the
// app also applies setGlobalPrefix('api/v1') — the real served route is
// /api/v1/api/v1/payments (see swagger.json). The apiClient baseURL is
// '/api/v1', so service paths below include the extra 'api/v1' segment.
export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  UPI = 'UPI',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED',
}

export interface PaymentAllocation {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  customerId: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  status: PaymentStatus;
  journalEntryId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Present on post/void responses; create returns the raw saved entity.
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocationDto {
  invoiceId: string;
  amount: number;
}

export interface CreatePaymentDto {
  customerId: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  allocations: PaymentAllocationDto[];
}
