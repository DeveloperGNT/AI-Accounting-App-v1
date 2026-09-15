import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Expense,
  CreateExpenseDto,
  PostExpenseDto,
} from './expensesTypes';

// Backend controller: @Controller('api/v1/expenses') ON TOP of the app-wide
// setGlobalPrefix('api/v1') → the real served route is /api/v1/api/v1/expenses
// (see swagger.json). The apiClient baseURL is '/api/v1', so paths include the
// extra 'api/v1' segment — this matches the served URL, NOT a duplication bug.
// Auth (Bearer) and the x-organization-id tenant header are attached by the
// shared apiClient interceptors; the organization is never hardcoded here.
export const expensesApi = {
  async create(payload: CreateExpenseDto): Promise<Expense> {
    const response = await apiClient.post('/api/v1/expenses', payload);
    return unwrapApiResponse<Expense>(response.data);
  },
  async list(): Promise<Expense[]> {
    const response = await apiClient.get('/api/v1/expenses');
    return unwrapApiResponse<Expense[]>(response.data);
  },
  async get(id: string): Promise<Expense> {
    const response = await apiClient.get(`/api/v1/expenses/${id}`);
    return unwrapApiResponse<Expense>(response.data);
  },
  async submit(id: string): Promise<Expense> {
    const response = await apiClient.post(`/api/v1/expenses/${id}/submit`);
    return unwrapApiResponse<Expense>(response.data);
  },
  async approve(id: string): Promise<Expense> {
    const response = await apiClient.post(`/api/v1/expenses/${id}/approve`);
    return unwrapApiResponse<Expense>(response.data);
  },
  async post(id: string, payload: PostExpenseDto): Promise<Expense> {
    const response = await apiClient.post(`/api/v1/expenses/${id}/post`, payload);
    return unwrapApiResponse<Expense>(response.data);
  },
  async reverse(id: string): Promise<Expense> {
    const response = await apiClient.post(`/api/v1/expenses/${id}/reverse`);
    return unwrapApiResponse<Expense>(response.data);
  },
  async cancel(id: string): Promise<Expense> {
    const response = await apiClient.post(`/api/v1/expenses/${id}/cancel`);
    return unwrapApiResponse<Expense>(response.data);
  },
};
