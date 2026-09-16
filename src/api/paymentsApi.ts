import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type { Payment, CreatePaymentDto } from './paymentsTypes';

// Route note: the backend PaymentsController declares @Controller('api/v1/
// payments') while main.ts also applies setGlobalPrefix('api/v1'), so the
// actually served route is /api/v1/api/v1/payments (the Swagger docs show the
// doubled path too). The apiClient baseURL is '/api/v1', so the service path
// must repeat 'api/v1' to match the browser-verified URL.
export const paymentsApi = {
  async create(payload: CreatePaymentDto): Promise<Payment> {
    const response = await apiClient.post('/api/v1/payments', payload);
    return unwrapApiResponse<Payment>(response.data);
  },
  async post(id: string): Promise<Payment> {
    const response = await apiClient.post(`/api/v1/payments/${id}/post`);
    return unwrapApiResponse<Payment>(response.data);
  },
  async void(id: string): Promise<Payment> {
    const response = await apiClient.post(`/api/v1/payments/${id}/void`);
    return unwrapApiResponse<Payment>(response.data);
  },
};
