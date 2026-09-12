export interface CreateInvitationDto {
  email: string;
  roleId: string;
}

export interface PreviewInvitationDto {
  token: string;
}

export interface AcceptInvitationDto {
  token: string;
}

export interface UpdateMemberRoleDto {
  roleId: string;
}

export interface InvitationPreviewResponse {
  email: string;
  organization: {
    name: string;
  };
  role: string;
  expiresAt: string; // ISO date string
}

export interface InvitationAcceptResponse {
  message: string;
  membership?: any; // can be refined later
}

export interface InvitationCreateResponse {
  token: string;
  message: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  status: string;
  joined_at: string;
  role?: {
    id: string;
    name: string;
  };
}
