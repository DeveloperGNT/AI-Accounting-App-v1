import { apiClient } from '../lib/axiosInstance';
import { unwrapApiResponse } from './response';
import type {
  InvitationPreviewResponse,
  InvitationAcceptResponse,
  InvitationCreateResponse,
  Membership,
  CreateInvitationDto,
  PreviewInvitationDto,
  AcceptInvitationDto,
  UpdateMemberRoleDto,
} from './membershipsTypes';

export const membershipsApi = {
  // POST /api/v1/memberships/invitations/preview
  async previewInvitation(payload: PreviewInvitationDto): Promise<InvitationPreviewResponse> {
    const response = await apiClient.post('/memberships/invitations/preview', payload);
    return unwrapApiResponse<InvitationPreviewResponse>(response.data);
  },

  // POST /api/v1/memberships/invitations/accept
  async acceptInvitation(payload: AcceptInvitationDto): Promise<InvitationAcceptResponse> {
    const response = await apiClient.post('/memberships/invitations/accept', payload);
    return unwrapApiResponse<InvitationAcceptResponse>(response.data);
  },

  // POST /api/v1/memberships/invitations
  async createInvitation(payload: CreateInvitationDto): Promise<InvitationCreateResponse> {
    const response = await apiClient.post('/memberships/invitations', payload);
    return unwrapApiResponse<InvitationCreateResponse>(response.data);
  },

  // GET /api/v1/memberships
  async list(): Promise<Membership[]> {
    const response = await apiClient.get('/memberships');
    return unwrapApiResponse<Membership[]>(response.data);
  },

  // PATCH /api/v1/memberships/{id}/role
  async updateRole(id: string, payload: UpdateMemberRoleDto): Promise<{ message: string }> {
    const response = await apiClient.patch(`/memberships/${id}/role`, payload);
    return unwrapApiResponse<{ message: string }>(response.data);
  },

  // POST /api/v1/memberships/{id}/transfer-ownership
  async transferOwnership(id: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/memberships/${id}/transfer-ownership`);
    return unwrapApiResponse<{ message: string }>(response.data);
  },

  // DELETE /api/v1/memberships/{id}
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/memberships/${id}`);
    return unwrapApiResponse<{ message: string }>(response.data);
  },
};
