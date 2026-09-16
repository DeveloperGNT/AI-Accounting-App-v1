export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface Account {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  accountType: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  createdById?: string | null;
  updatedById?: string | null;
}

export interface CreateAccountDto {
  code: string;
  name: string;
  accountType: string;
}

export interface UpdateAccountDto {
  code?: string;
  name?: string;
  accountType?: string;
}

export interface AccountListResponse {
  data: Account[];
  total: number;
  page: number;
  limit: number;
}

export interface DeleteAccountResponse {
  success: boolean;
}