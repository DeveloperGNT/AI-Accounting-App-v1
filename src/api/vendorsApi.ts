import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Vendor,
  CreateVendorDto,
  UpdateVendorDto,
  VendorListResponse,
  DeleteVendorResponse,
} from './vendorsTypes';

export const vendorsApi = {
  async create(payload: CreateVendorDto): Promise<Vendor> {
    const response = await apiClient.post('/vendors', payload);
    return unwrapApiResponse<Vendor>(response.data);
  },
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<VendorListResponse> {
    const response = await apiClient.get('/vendors', { params });
    return unwrapApiResponse<VendorListResponse>(response.data);
  },
  async get(id: string): Promise<Vendor> {
    const response = await apiClient.get(`/vendors/${id}`);
    return unwrapApiResponse<Vendor>(response.data);
  },
  async update(id: string, payload: UpdateVendorDto): Promise<Vendor> {
    const response = await apiClient.patch(`/vendors/${id}`, payload);
    return unwrapApiResponse<Vendor>(response.data);
  },
  async remove(id: string): Promise<DeleteVendorResponse> {
    const response = await apiClient.delete(`/vendors/${id}`);
    return unwrapApiResponse<DeleteVendorResponse>(response.data);
  },
};
