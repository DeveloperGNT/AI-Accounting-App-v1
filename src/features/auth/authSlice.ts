import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import type {
  ApiError,
  AuthCredentials,
  AuthUserResponse,
  SignupRequest,
  SignupResult,
  SupabaseSessionSummary,
  VerifyRlsResponse,
} from '../../api/types';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AuthState {
  session: SupabaseSessionSummary | null;
  user: AuthUserResponse | null;
  status: RequestStatus;
  error: ApiError | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isInitialized: boolean;
  signupRequiresEmailConfirmation: boolean;
  rlsStatus: RequestStatus;
  rlsResult: VerifyRlsResponse | null;
  rlsError: ApiError | null;
}

const initialState: AuthState = {
  session: null,
  user: null,
  status: 'idle',
  error: null,
  isAuthenticated: false,
  isInitializing: true,
  isInitialized: false,
  signupRequiresEmailConfirmation: false,
  rlsStatus: 'idle',
  rlsResult: null,
  rlsError: null,
};

const toApiError = (error: unknown, fallbackCode: string, fallbackMessage: string): ApiError => {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as ApiError;
  }

  return { code: fallbackCode, message: fallbackMessage };
};

const getRejectedError = (
  error: ApiError | undefined,
  fallbackCode: string,
  fallbackMessage: string,
): ApiError =>
  error || {
    code: fallbackCode,
    message: fallbackMessage,
  };

export const login = createAsyncThunk<
  { session: SupabaseSessionSummary; user: AuthUserResponse | null },
  AuthCredentials,
  { rejectValue: ApiError }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authApi.login(credentials);
  } catch (error) {
    return rejectWithValue(toApiError(error, 'LOGIN_FAILED', 'Unable to sign in.'));
  }
});

export const signup = createAsyncThunk<
  SignupResult,
  SignupRequest,
  { rejectValue: ApiError }
>('auth/signup', async (request, { rejectWithValue }) => {
  try {
    return await authApi.signup(request);
  } catch (error) {
    return rejectWithValue(toApiError(error, 'SIGNUP_FAILED', 'Unable to create the account.'));
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (error) {
      return rejectWithValue(toApiError(error, 'LOGOUT_FAILED', 'Unable to sign out.'));
    }
  },
);

export const restoreSession = createAsyncThunk<
  { session: SupabaseSessionSummary | null; user: AuthUserResponse | null },
  void,
  { rejectValue: ApiError }
>('auth/restoreSession', async (_, { rejectWithValue }) => {
  try {
    return await authApi.restoreSession();
  } catch (error) {
    return rejectWithValue(toApiError(error, 'SESSION_RESTORE_FAILED', 'Unable to restore the session.'));
  }
});

export const resetPassword = createAsyncThunk<
  void,
  string,
  { rejectValue: ApiError }
>('auth/resetPassword', async (email, { rejectWithValue }) => {
  try {
    await authApi.resetPassword(email);
  } catch (error) {
    return rejectWithValue(toApiError(error, 'PASSWORD_RESET_FAILED', 'Unable to send password reset instructions.'));
  }
});

export const updatePassword = createAsyncThunk<
  void,
  string,
  { rejectValue: ApiError }
>('auth/updatePassword', async (password, { rejectWithValue }) => {
  try {
    await authApi.updatePassword(password);
  } catch (error) {
    return rejectWithValue(toApiError(error, 'PASSWORD_UPDATE_FAILED', 'Unable to update your password.'));
  }
});

export const fetchCurrentUser = createAsyncThunk<
  AuthUserResponse,
  void,
  { rejectValue: ApiError }
>('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    return await authApi.getCurrentUser();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const verifyRls = createAsyncThunk<
  VerifyRlsResponse,
  void,
  { rejectValue: ApiError }
>('auth/verifyRls', async (_, { rejectWithValue }) => {
  try {
    return await authApi.verifyRls();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth(state) {
      state.session = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      state.isInitialized = true;
      state.signupRequiresEmailConfirmation = false;
      state.rlsStatus = 'idle';
      state.rlsResult = null;
      state.rlsError = null;
    },
    setSessionSummary(state, action: PayloadAction<SupabaseSessionSummary | null>) {
      state.session = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'AUTH_REQUEST_FAILED',
          message: action.error.message || 'Unable to load the authenticated user.',
        };
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.signupRequiresEmailConfirmation = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.isAuthenticated = Boolean(action.payload.session);
        state.isInitialized = true;
        state.isInitializing = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        // Only treat the attempt as unauthenticated when Supabase never
        // established a session (bad credentials). If a session exists, it is
        // the source of truth and the login page must not reappear.
        if (!state.session) {
          state.isAuthenticated = false;
        }
        state.error = action.payload || {
          code: 'LOGIN_FAILED',
          message: action.error.message || 'Unable to sign in.',
        };
      })
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.signupRequiresEmailConfirmation = false;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.isAuthenticated = Boolean(action.payload.session);
        state.isInitialized = true;
        state.isInitializing = false;
        state.signupRequiresEmailConfirmation = action.payload.requiresEmailConfirmation;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'SIGNUP_FAILED',
          message: action.error.message || 'Unable to create the account.',
        };
      })
      .addCase(logout.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.session = null;
        state.user = null;
        state.status = 'idle';
        state.error = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
        state.isInitialized = true;
        state.signupRequiresEmailConfirmation = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'LOGOUT_FAILED',
          message: action.error.message || 'Unable to sign out.',
        };
      })
      .addCase(restoreSession.pending, (state) => {
        state.isInitializing = true;
        state.isInitialized = false;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (!action.payload.session && state.isAuthenticated) {
          state.isInitializing = false;
          state.isInitialized = true;
          return;
        }

        state.session = action.payload.session;
        state.user = action.payload.user;
        // The Supabase session decides authentication; the backend user is
        // enrichment that can be retried without bouncing to the login page.
        state.isAuthenticated = Boolean(action.payload.session);
        state.isInitializing = false;
        state.isInitialized = true;
        state.status = action.payload.session ? 'succeeded' : 'idle';
      })
      .addCase(restoreSession.rejected, (state, action) => {
        if (state.isAuthenticated) {
          state.isInitializing = false;
          state.isInitialized = true;
          return;
        }

        state.session = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
        state.isInitialized = true;
        state.status = 'failed';
        state.error = action.payload || {
          code: 'SESSION_RESTORE_FAILED',
          message: action.error.message || 'Unable to restore the session.',
        };
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getRejectedError(
          action.payload,
          'PASSWORD_RESET_FAILED',
          action.error.message || 'Unable to send password reset instructions.',
        );
      })
      .addCase(updatePassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = getRejectedError(
          action.payload,
          'PASSWORD_UPDATE_FAILED',
          action.error.message || 'Unable to update your password.',
        );
      })
      .addCase(verifyRls.pending, (state) => {
        state.rlsStatus = 'loading';
        state.rlsError = null;
      })
      .addCase(verifyRls.fulfilled, (state, action) => {
        state.rlsStatus = 'succeeded';
        state.rlsResult = action.payload;
      })
      .addCase(verifyRls.rejected, (state, action) => {
        state.rlsStatus = 'failed';
        state.rlsError = action.payload || {
          code: 'RLS_REQUEST_FAILED',
          message: action.error.message || 'Unable to verify tenant access.',
        };
      });
  },
});

export const { clearAuth, setSessionSummary } = authSlice.actions;
export default authSlice.reducer;