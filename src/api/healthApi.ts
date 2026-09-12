import { apiClient } from '../lib/axiosInstance';
import { toApiError } from '../lib/apiError';
import { unwrapApiResponse } from './response';

export const healthApi = {
  async getApiInfo(): Promise<unknown> {
    try {
      const response = await apiClient.get('/');
      return unwrapApiResponse(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getHealth(): Promise<unknown> {
    try {
      const response = await apiClient.get('/health');
      return unwrapApiResponse(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },
};