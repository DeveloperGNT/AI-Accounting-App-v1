import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ListCategoriesResponse,
} from './categoriesTypes';

export const categoriesApi = {
  // POST /api/v1/categories
  async create(payload: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post('/categories', payload);
    return unwrapApiResponse<Category>(response.data);
  },

  // GET /api/v1/categories with optional pagination/search
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ListCategoriesResponse> {
    const response = await apiClient.get('/categories', { params });
    return unwrapApiResponse<ListCategoriesResponse>(response.data);
  },

  // GET /api/v1/categories/:id
  async get(id: string): Promise<Category> {
    const response = await apiClient.get(`/categories/${id}`);
    return unwrapApiResponse<Category>(response.data);
  },

  // PATCH /api/v1/categories/:id
  async update(id: string, payload: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.patch(`/categories/${id}`, payload);
    return unwrapApiResponse<Category>(response.data);
  },

  // DELETE /api/v1/categories/:id
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/categories/${id}`);
    return unwrapApiResponse<{ success: boolean }>(response.data);
  },
};
