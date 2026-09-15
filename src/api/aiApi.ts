import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from '../api/response';
import type {
  AiChatResponse,
  AiExtractBillRequest,
  AiExtractionProposal,
  AiAuditLog
} from './aiTypes';

// AI API service
export const aiApi = {
  // AI Chat
  async chatAi(organizationId: string, query: string): Promise<AiChatResponse> {
    const response = await apiClient.post(
      `/organizations/${organizationId}/ai/chat`,
      { query }
    );

    return unwrapApiResponse<AiChatResponse>(response.data);
  },

  // AI Extract Bill
  async extractBill(organizationId: string, fileId: string): Promise<AiExtractionProposal> {
    const response = await apiClient.post(
      `/organizations/${organizationId}/ai/extract-bill`,
      { fileId }
    );

    return unwrapApiResponse<AiExtractionProposal>(response.data);
  },

  // Get AI Audit Logs
  async fetchAiAuditLogs(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AiAuditLog[]> {
    const response = await apiClient.get(
      `/organizations/${organizationId}/ai/audit-logs`,
      {
        params: {
          limit,
          offset
        }
      }
    );

    return unwrapApiResponse<AiAuditLog[]>(response.data);
  }
};