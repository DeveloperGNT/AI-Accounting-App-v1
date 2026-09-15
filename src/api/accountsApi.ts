import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  DeleteAccountResponse,
} from './accountsTypes';

export const accountsApi = {
  // POST /accounts
  async create(payload: CreateAccountDto): Promise<Account> {
    const response = await apiClient.post('/accounts', payload);
    return unwrapApiResponse<Account>(response.data);
  },
  // GET /accounts — the backend returns a BARE ARRAY
  // (accounts.controller.ts: return { success: true, data } where data =
  // Account[] from accountsService.findAll), not a paginated { data, total }.
  async list(): Promise<Account[]> {
    const response = await apiClient.get('/accounts');
    return unwrapApiResponse<Account[]>(response.data);
  },
  // GET /accounts/:id
  async get(id: string): Promise<Account> {
    const response = await apiClient.get(`/accounts/${id}`);
    return unwrapApiResponse<Account>(response.data);
  },
  // PATCH /accounts/:id
  async update(id: string, payload: UpdateAccountDto): Promise<Account> {
    const response = await apiClient.patch(`/accounts/${id}`, payload);
    return unwrapApiResponse<Account>(response.data);
  },
  // DELETE /accounts/:id
  async remove(id: string): Promise<DeleteAccountResponse> {
    const response = await apiClient.delete(`/accounts/${id}`);
    return unwrapApiResponse<DeleteAccountResponse>(response.data);
  },
};
