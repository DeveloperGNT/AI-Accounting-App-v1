import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  DeleteInvoiceResponse,
} from './invoicesTypes';

// Backend controller route: @Controller('api/v1/invoices') ON TOP of the
// app-wide setGlobalPrefix('api/v1') → the real served route is
// /api/v1/api/v1/invoices (see swagger.json). The apiClient baseURL is
// '/api/v1', so paths include the extra 'api/v1' segment — this matches the
// served URL, it is NOT a duplication bug.
export const invoicesApi = {
  async create(payload: CreateInvoiceDto): Promise<Invoice> {
    const response = await apiClient.post('/api/v1/invoices', payload);
    return unwrapApiResponse<Invoice>(response.data);
  },
  async list(): Promise<Invoice[]> {
    const response = await apiClient.get('/api/v1/invoices');
    return unwrapApiResponse<Invoice[]>(response.data);
  },
  async get(id: string): Promise<Invoice> {
    const response = await apiClient.get(`/api/v1/invoices/${id}`);
    return unwrapApiResponse<Invoice>(response.data);
  },
  async update(id: string, payload: UpdateInvoiceDto): Promise<Invoice> {
    const response = await apiClient.patch(`/api/v1/invoices/${id}`, payload);
    return unwrapApiResponse<Invoice>(response.data);
  },
  async remove(id: string): Promise<DeleteInvoiceResponse> {
    const response = await apiClient.delete(`/api/v1/invoices/${id}`);
    return unwrapApiResponse<DeleteInvoiceResponse>(response.data);
  },
  async finalize(id: string): Promise<Invoice> {
    const response = await apiClient.post(`/api/v1/invoices/${id}/finalize`);
    return unwrapApiResponse<Invoice>(response.data);
  },
  async cancel(id: string): Promise<Invoice> {
    const response = await apiClient.post(`/api/v1/invoices/${id}/cancel`);
    return unwrapApiResponse<Invoice>(response.data);
  },
};
