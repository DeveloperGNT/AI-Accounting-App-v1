import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from '../api/response';
import type { OrganizationResponse, UserProfile } from '../types';

// Admin Organization APIs
export const adminApi = {
  // Get all organizations (platform admin)
  async getAllOrganizations(): Promise<OrganizationResponse[]> {
    const response = await apiClient.get(`/admin/organizations`);
    return unwrapApiResponse<OrganizationResponse[]>(response.data);
  },

  // Get organization by ID (platform admin)
  async getOrganizationById(id: string): Promise<OrganizationResponse> {
    const response = await apiClient.get(`/admin/organizations/${id}`);
    return unwrapApiResponse<OrganizationResponse>(response.data);
  },

  // Update organization status (suspend/reactivate)
  async updateOrganizationStatus(id: string, status: string): Promise<OrganizationResponse> {
    const response = await apiClient.patch(`/admin/organizations/${id}/status`, { status });
    return unwrapApiResponse<OrganizationResponse>(response.data);
  },

  // Get all users (platform admin)
  async getAllUsers(): Promise<UserProfile[]> {
    const response = await apiClient.get(`/admin/users`);
    return unwrapApiResponse<UserProfile[]>(response.data);
  },

  // Get user by ID (platform admin)
  async getUserById(id: string): Promise<UserProfile> {
    const response = await apiClient.get(`/admin/users/${id}`);
    return unwrapApiResponse<UserProfile>(response.data);
  }
};