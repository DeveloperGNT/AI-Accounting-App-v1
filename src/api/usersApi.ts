import { apiClient } from '../lib/axiosInstance';
import { toApiError } from '../lib/apiError';
import { unwrapApiResponse } from './response';
import type { UpdateUserProfileRequest, UserProfile } from './types';

export const usersApi = {
  async getCurrentProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/users/me');
      return unwrapApiResponse<UserProfile>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async updateCurrentProfile(payload: UpdateUserProfileRequest): Promise<UserProfile> {
    try {
      const response = await apiClient.patch('/users/me', payload);
      return unwrapApiResponse<UserProfile>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },
};