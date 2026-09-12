export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  creditLimit?: number;
  outstandingBalance: number;
  totalSales: number;
  paymentTermsDays: number;
  lastTransactionDate?: string; // ISO string
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateCustomerDto {
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  creditLimit?: number;
  paymentTermsDays: number;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface DeleteCustomerResponse {
  success: boolean;
}
