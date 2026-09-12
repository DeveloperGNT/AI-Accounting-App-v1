import { apiClient } from '../lib/axiosInstance';
import { toApiError } from '../lib/apiError';
import { supabase } from '../lib/supabaseClient';
import { unwrapApiResponse } from './response';
import type {
  AuthCredentials,
  AuthUserResponse,
  SignupRequest,
  SignupResult,
  SupabaseSessionSummary,
  VerifyRlsResponse,
} from './types';

const getSessionSummary = (session: {
  user: { id: string };
  expires_at?: number;
}): SupabaseSessionSummary => ({
  userId: session.user.id,
  expiresAt: session.expires_at ?? null,
});

const requireSupabase = () => {
  if (!supabase) {
    throw {
      code: 'SUPABASE_NOT_CONFIGURED',
      message: 'Authentication is not configured. Add the frontend Supabase environment variables.',
    };
  }

  return supabase;
};

const getAuthError = (error: unknown) => {
  const providerError = error as {
    message?: unknown;
    code?: unknown;
    error_code?: unknown;
    status?: unknown;
    error_id?: unknown;
    msg?: unknown;
  } | null;

  const providerMessage =
    providerError && typeof providerError.message === 'string'
      ? providerError.message
      : providerError && typeof providerError.msg === 'string'
        ? providerError.msg
      : 'Authentication could not be completed.';
  const providerCode =
    providerError && typeof providerError.code === 'string'
      ? providerError.code
      : providerError && typeof providerError.error_code === 'string'
        ? providerError.error_code
        : undefined;
  const providerStatus =
    providerError && typeof providerError.status === 'number' ? providerError.status : undefined;
  const providerErrorId =
    providerError && typeof providerError.error_id === 'string' ? providerError.error_id : undefined;
  const message =
    providerCode === 'unexpected_failure' && providerStatus === 500
      ? 'Supabase could not send the recovery email. Check the Supabase Auth email provider or SMTP configuration.'
      : providerMessage;

  return {
    code: providerCode || 'SUPABASE_AUTH_ERROR',
    message,
    providerCode,
    providerStatus,
    providerErrorId,
    providerMessage,
  };
};

export const authApi = {
  async login(credentials: AuthCredentials): Promise<{
    session: SupabaseSessionSummary;
    user: AuthUserResponse | null;
  }> {
    try {
      const client = requireSupabase();
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (!data.session) {
        throw { message: 'No authenticated session was returned.' };
      }

      // Supabase has persisted the session by this point. A failed backend
      // /auth/me load must not reject the sign-in, or Redux would flip back to
      // unauthenticated while the SIGNED_IN listener re-authenticates it.
      let user: AuthUserResponse | null = null;
      try {
        user = await this.getCurrentUser();
      } catch {
        user = null;
      }

      return {
        session: getSessionSummary(data.session),
        user,
      };
    } catch (error) {
      throw getAuthError(error);
    }
  },

  async signup(request: SignupRequest): Promise<SignupResult> {
    try {
      const client = requireSupabase();
      const { data, error } = await client.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            display_name: request.name,
          },
        },
      });
      if (error) throw error;

      if (!data.session) {
        return {
          session: null,
          user: null,
          requiresEmailConfirmation: true,
        };
      }

      // Same constraint as login: the Supabase session is authoritative, the
      // backend profile load is retried by the SIGNED_IN listener.
      let user: AuthUserResponse | null = null;
      try {
        user = await this.getCurrentUser();
      } catch {
        user = null;
      }

      return {
        session: getSessionSummary(data.session),
        user,
        requiresEmailConfirmation: false,
      };
    } catch (error) {
      throw getAuthError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      const client = requireSupabase();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw getAuthError(error);
    }
  },

  async restoreSession(): Promise<{
    session: SupabaseSessionSummary | null;
    user: AuthUserResponse | null;
  }> {
    try {
      const client = requireSupabase();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) return { session: null, user: null };

      // A live Supabase session remains the source of truth even when the
      // backend profile load fails; rejecting here would drop an
      // authenticated user back onto the login page after a transient error.
      let user: AuthUserResponse | null = null;
      try {
        user = await this.getCurrentUser();
      } catch {
        user = null;
      }

      return {
        session: getSessionSummary(data.session),
        user,
      };
    } catch (error) {
      throw getAuthError(error);
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      const client = requireSupabase();
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      throw getAuthError(error);
    }
  },

  async updatePassword(password: string): Promise<void> {
    try {
      const client = requireSupabase();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    } catch (error) {
      throw getAuthError(error);
    }
  },

  async getCurrentUser(): Promise<AuthUserResponse> {
    try {
      const response = await apiClient.get('/auth/me');
      return unwrapApiResponse<AuthUserResponse>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async verifyRls(): Promise<VerifyRlsResponse> {
    try {
      const response = await apiClient.get('/auth/verify-rls');
      return unwrapApiResponse<VerifyRlsResponse>(response.data);
    } catch (error) {
      throw toApiError(error);
    }
  },
};