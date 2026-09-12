import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerListResponse,
  DeleteCustomerResponse,
} from './customersTypes';

export const customersApi = {
  async create(payload: CreateCustomerDto): Promise<Customer> {
    const response = await apiClient.post('/customers', payload);
    return unwrapApiResponse<Customer>(response.data);
  },
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<CustomerListResponse> {
    const response = await apiClient.get('/customers', { params });
    return unwrapApiResponse<CustomerListResponse>(response.data);
  },
  async get(id: string): Promise<Customer> {
    const response = await apiClient.get(`/customers/${id}`);
    return unwrapApiResponse<Customer>(response.data);
  },
  async update(id: string, payload: UpdateCustomerDto): Promise<Customer> {
    const response = await apiClient.patch(`/customers/${id}`, payload);
    return unwrapApiResponse<Customer>(response.data);
  },
  async remove(id: string): Promise<DeleteCustomerResponse> {
    const response = await apiClient.delete(`/customers/${id}`);
    return unwrapApiResponse<DeleteCustomerResponse>(response.data);
  },
};
