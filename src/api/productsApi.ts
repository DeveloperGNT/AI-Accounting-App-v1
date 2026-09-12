import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductListResponse,
  DeleteProductResponse,
} from './productsTypes';

export const productsApi = {
  async create(payload: CreateProductDto): Promise<Product> {
    const response = await apiClient.post('/products', payload);
    return unwrapApiResponse<Product>(response.data);
  },
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ProductListResponse> {
    const response = await apiClient.get('/products', { params });
    return unwrapApiResponse<ProductListResponse>(response.data);
  },
  async get(id: string): Promise<Product> {
    const response = await apiClient.get(`/products/${id}`);
    return unwrapApiResponse<Product>(response.data);
  },
  async update(id: string, payload: UpdateProductDto): Promise<Product> {
    const response = await apiClient.patch(`/products/${id}`, payload);
    return unwrapApiResponse<Product>(response.data);
  },
  async delete(id: string): Promise<DeleteProductResponse> {
    const response = await apiClient.delete(`/products/${id}`);
    return unwrapApiResponse<DeleteProductResponse>(response.data);
  },
};
