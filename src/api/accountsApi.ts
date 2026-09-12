import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  DeleteAccountResponse,
} from './accountsTypes';

// Backend controller: @Controller('api/v1/accounts') ON TOP of the app-wide
// setGlobalPrefix('api/v1') → the real served route is /api/v1/api/v1/accounts
// (see swagger.json). The apiClient baseURL is '/api/v1', so paths include the
// extra 'api/v1' segment — this matches the served URL, NOT a duplication bug.
export const accountsApi = {
  // POST /api/v1/api/v1/accounts
  async create(payload: CreateAccountDto): Promise<Account> {
    const response = await apiClient.post('/api/v1/accounts', payload);
    return unwrapApiResponse<Account>(response.data);
  },
  // GET /api/v1/api/v1/accounts — the backend returns a BARE ARRAY
  // (accounts.controller.ts: return { success: true, data } where data =
  // Account[] from accountsService.findAll), not a paginated { data, total }.
  async list(): Promise<Account[]> {
    const response = await apiClient.get('/api/v1/accounts');
    return unwrapApiResponse<Account[]>(response.data);
  },
  // GET /api/v1/api/v1/accounts/:id
  async get(id: string): Promise<Account> {
    const response = await apiClient.get(`/api/v1/accounts/${id}`);
    return unwrapApiResponse<Account>(response.data);
  },
  // PATCH /api/v1/api/v1/accounts/:id
  async update(id: string, payload: UpdateAccountDto): Promise<Account> {
    const response = await apiClient.patch(`/api/v1/accounts/${id}`, payload);
    return unwrapApiResponse<Account>(response.data);
  },
  // DELETE /api/v1/api/v1/accounts/:id
  async remove(id: string): Promise<DeleteAccountResponse> {
    const response = await apiClient.delete(`/api/v1/accounts/${id}`);
    return unwrapApiResponse<DeleteAccountResponse>(response.data);
  },
};
