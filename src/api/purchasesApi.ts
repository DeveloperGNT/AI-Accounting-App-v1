import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  PurchaseBill,
  CreatePurchaseBillDto,
  UpdatePurchaseBillDto,
  DeletePurchaseBillResponse,
} from './purchasesTypes';

// Route note: the backend PurchasesController declares @Controller('api/v1/
// bills') while main.ts also applies setGlobalPrefix('api/v1'), so the
// actually served route is /api/v1/api/v1/bills (the Swagger docs show the
// doubled path too). The apiClient baseURL is '/api/v1', so the service path
// must repeat 'api/v1' to match the browser-verified URL.
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
