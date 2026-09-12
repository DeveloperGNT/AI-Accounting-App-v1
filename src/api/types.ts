export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  providerCode?: string;
  providerStatus?: number;
  providerErrorId?: string;
  providerMessage?: string;
  path?: string;
  timestamp?: string;
  requestId?: string;
  validationMessages?: string[];
}

export interface AuthMembership {
  organization_id: string;
  organization_name: string;
  role_name: string;
}

export interface AuthUserResponse {
  id: string;
  email?: string;
  profile: Record<string, unknown> | null;
  memberships: AuthMembership[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupRequest extends AuthCredentials {
  name: string;
}

export interface SupabaseSessionSummary {
  userId: string;
  expiresAt: number | null;
}

export interface SignupResult {
  session: SupabaseSessionSummary | null;
  user: AuthUserResponse | null;
  requiresEmailConfirmation: boolean;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  platform_role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserProfileRequest {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface VerifyRlsResponse {
  requestedTenantId: string;
  returnedOrgs: unknown[];
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  business_type?: string | null;
  gstin?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  business_type?: string;
  gstin?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  business_type?: string;
  gstin?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}