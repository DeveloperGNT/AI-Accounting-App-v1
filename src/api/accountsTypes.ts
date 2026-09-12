export interface Account {
  id: string;
  // Add other fields as needed
  [key: string]: any;
}

export interface CreateAccountDto {
  // Define fields required to create an account
  [key: string]: any;
}

export interface UpdateAccountDto {
  // Fields for partial update
  [key: string]: any;
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
