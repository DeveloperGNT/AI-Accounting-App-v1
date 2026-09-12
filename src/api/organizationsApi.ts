import { apiClient } from '../lib/axiosInstance';
import { toApiError } from '../lib/apiError';
import { unwrapApiResponse } from './response';
import type {
  CreateOrganizationRequest,
  OrganizationResponse,
  UpdateOrganizationRequest,
} from './types';

export const organizationsApi = {
  async list(): Promise<OrganizationResponse[]> {
    try {
      const response = await apiClient.get('/organizations');
      return unwrapApiResponse<OrganizationResponse[]>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async create(payload: CreateOrganizationRequest): Promise<OrganizationResponse> {
    try {
      const response = await apiClient.post('/organizations', payload);
      return unwrapApiResponse<OrganizationResponse>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getCurrent(): Promise<OrganizationResponse> {
    try {
      const response = await apiClient.get('/organizations/current');
      return unwrapApiResponse<OrganizationResponse>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateCurrent(payload: UpdateOrganizationRequest): Promise<OrganizationResponse> {
    try {
      const response = await apiClient.patch('/organizations/current', payload);
      return unwrapApiResponse<OrganizationResponse>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },
};
