import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  PurchaseBill,
  CreatePurchaseBillDto,
  UpdatePurchaseBillDto,
  DeletePurchaseBillResponse,
} from './purchasesTypes';

// Backend controller: @Controller('api/v1/bills') ON TOP of the app-wide
// setGlobalPrefix('api/v1') → the real served route is /api/v1/api/v1/bills
// (see swagger.json). The apiClient baseURL is '/api/v1', so paths include the
// extra 'api/v1' segment — this matches the served URL, NOT a duplication bug.
// Auth (Bearer) and the x-organization-id tenant header are attached by the
// shared apiClient interceptors; the organization is never hardcoded here.
export const purchasesApi = {
  async create(payload: CreatePurchaseBillDto): Promise<PurchaseBill> {
    const response = await apiClient.post('/api/v1/bills', payload);
    return unwrapApiResponse<PurchaseBill>(response.data);
  },
  async list(): Promise<PurchaseBill[]> {
    const response = await apiClient.get('/api/v1/bills');
    return unwrapApiResponse<PurchaseBill[]>(response.data);
  },
  async get(id: string): Promise<PurchaseBill> {
    const response = await apiClient.get(`/api/v1/bills/${id}`);
    return unwrapApiResponse<PurchaseBill>(response.data);
  },
  async update(id: string, payload: UpdatePurchaseBillDto): Promise<PurchaseBill> {
    const response = await apiClient.patch(`/api/v1/bills/${id}`, payload);
    return unwrapApiResponse<PurchaseBill>(response.data);
  },
  async remove(id: string): Promise<DeletePurchaseBillResponse> {
    const response = await apiClient.delete(`/api/v1/bills/${id}`);
    return unwrapApiResponse<DeletePurchaseBillResponse>(response.data);
  },
  async finalize(id: string): Promise<PurchaseBill> {
    const response = await apiClient.post(`/api/v1/bills/${id}/finalize`);
    return unwrapApiResponse<PurchaseBill>(response.data);
  },
  async cancel(id: string): Promise<PurchaseBill> {
    const response = await apiClient.post(`/api/v1/bills/${id}/cancel`);
    return unwrapApiResponse<PurchaseBill>(response.data);
  },
};
