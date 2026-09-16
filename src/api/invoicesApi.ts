import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  DeleteInvoiceResponse,
} from './invoicesTypes';

// Route note: the backend InvoicesController declares @Controller('api/v1/
// invoices') while main.ts also applies setGlobalPrefix('api/v1'), so the
// actually served route is /api/v1/api/v1/invoices (the Swagger docs show the
// doubled path too). The apiClient baseURL is '/api/v1', so the service path
// must repeat 'api/v1' to match the browser-verified URL.
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
