import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from '../api/response';
import type {
  FileRecord,
  UploadFileResponse,
  DownloadUrlResponse,
  LinkFilePayload,
  LinkFileResponse
} from './filesTypes';

// Files API service
export const filesApi = {
  // Upload a file
  async uploadFile(organizationId: string, file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/organizations/${organizationId}/files/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return unwrapApiResponse<UploadFileResponse>(response.data);
  },

  // Get file metadata
  async getFile(organizationId: string, fileId: string): Promise<FileRecord> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/files/${fileId}`
    );

    return unwrapApiResponse<{ file: FileRecord }>(response.data).file;
  },

  // Delete a file
  async deleteFile(organizationId: string, fileId: string): Promise<void> {
    const response = await apiClient.delete(
      `/organizations/${organizationId}/files/${fileId}`
    );

    return unwrapApiResponse<void>(response.data);
  },

  // Get download URL for a file
  async getDownloadUrl(organizationId: string, fileId: string): Promise<DownloadUrlResponse> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/files/${fileId}/download-url`
    );

    return unwrapApiResponse<DownloadUrlResponse>(response.data);
  },

  // Link a file to an entity
  async linkFile(
    organizationId: string,
    fileId: string,
    payload: LinkFilePayload
  ): Promise<LinkFileResponse> {
    const response = await apiClient.post(
      `/organizations/${organizationId}/files/${fileId}/link`,
      payload
    );

    return unwrapApiResponse<LinkFileResponse>(response.data);
  }
};