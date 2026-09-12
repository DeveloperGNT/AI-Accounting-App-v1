import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type { Payment, CreatePaymentDto } from './paymentsTypes';

// The backend PaymentsController is declared as @Controller('api/v1/payments')
// on top of the app-wide setGlobalPrefix('api/v1'), so the real route served
// is /api/v1/api/v1/payments (visible doubled in swagger.json too). The
// apiClient baseURL is '/api/v1', hence the '/api/v1/payments' relative path
// here — this matches the served URL, it is NOT a duplication bug.
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
