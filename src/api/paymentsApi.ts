import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type { Payment, CreatePaymentDto } from './paymentsTypes';

export const paymentsApi = {
  async create(payload: CreatePaymentDto): Promise<Payment> {
    const response = await apiClient.post('/payments', payload);
    return unwrapApiResponse<Payment>(response.data);
  },
  async post(id: string): Promise<Payment> {
    const response = await apiClient.post(`/payments/${id}/post`);
    return unwrapApiResponse<Payment>(response.data);
  },
  async void(id: string): Promise<Payment> {
    const response = await apiClient.post(`/payments/${id}/void`);
    return unwrapApiResponse<Payment>(response.data);
  },
};
