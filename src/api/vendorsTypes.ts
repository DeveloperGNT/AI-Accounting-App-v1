export interface Vendor {
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
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  outstandingBalance: number;
  totalPurchases: number;
  paymentTermsDays?: number;
  lastTransactionDate?: string; // ISO string
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateVendorDto {
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
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  paymentTermsDays?: number;
}

export type UpdateVendorDto = Partial<CreateVendorDto>;

export interface VendorListResponse {
  data: Vendor[];
  total: number;
  page: number;
  limit: number;
}

export interface DeleteVendorResponse {
  success: boolean;
}
