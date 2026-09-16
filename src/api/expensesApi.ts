import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Expense,
  CreateExpenseDto,
  PostExpenseDto,
} from './expensesTypes';

// Route note: the backend ExpensesController declares @Controller('api/v1/
// expenses') while main.ts also applies setGlobalPrefix('api/v1'), so the
// actually served route is /api/v1/api/v1/expenses (the Swagger docs show the
// doubled path too). The apiClient baseURL is '/api/v1', so the service path
// must repeat 'api/v1' to match the browser-verified URL.
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
