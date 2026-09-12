import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  VendorPayment,
  CreateVendorPaymentDto,
  PostVendorPaymentDto,
} from './vendorPaymentsTypes';

// Backend controller: @Controller('vendor-payments') — no hardcoded prefix —
// so with the global prefix the served route is /api/v1/vendor-payments.
// The apiClient baseURL is already '/api/v1', so paths stay relative
// ('/vendor-payments...'). Auth (Bearer) and the x-organization-id tenant
// header are attached by the shared apiClient interceptors.
export const vendorPaymentsApi = {
  async create(payload: CreateVendorPaymentDto): Promise<VendorPayment> {
    const response = await apiClient.post('/vendor-payments', payload);
    return unwrapApiResponse<VendorPayment>(response.data);
  },
  async list(): Promise<VendorPayment[]> {
    const response = await apiClient.get('/vendor-payments');
    return unwrapApiResponse<VendorPayment[]>(response.data);
  },
  async get(id: string): Promise<VendorPayment> {
    const response = await apiClient.get(`/vendor-payments/${id}`);
    return unwrapApiResponse<VendorPayment>(response.data);
  },
  async post(id: string, payload: PostVendorPaymentDto): Promise<VendorPayment> {
    const response = await apiClient.post(`/vendor-payments/${id}/post`, payload);
    return unwrapApiResponse<VendorPayment>(response.data);
  },
  async void(id: string): Promise<VendorPayment> {
    const response = await apiClient.post(`/vendor-payments/${id}/void`);
    return unwrapApiResponse<VendorPayment>(response.data);
  },
};
