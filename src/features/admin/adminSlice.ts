import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { adminApi } from '../../api/adminApi';
import type { ApiError, OrganizationResponse, UserProfile } from '../../api/types';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AdminState {
  organizations: OrganizationResponse[];
  organizationStatus: RequestStatus;
  organizationError: ApiError | null;

  users: UserProfile[];
  usersStatus: RequestStatus;
  usersError: ApiError | null;

  selectedOrganization: OrganizationResponse | null;
  selectedOrganizationStatus: RequestStatus;
  selectedOrganizationError: ApiError | null;

  selectedUser: UserProfile | null;
  selectedUserStatus: RequestStatus;
  selectedUserError: ApiError | null;
}

const initialState: AdminState = {
  organizations: [],
  organizationStatus: 'idle',
  organizationError: null,

  users: [],
  usersStatus: 'idle',
  usersError: null,

  selectedOrganization: null,
  selectedOrganizationStatus: 'idle',
  selectedOrganizationError: null,

  selectedUser: null,
  selectedUserStatus: 'idle',
  selectedUserError: null,
};

// Organization APIs
export const fetchAllOrganizations = createAsyncThunk<
  OrganizationResponse[],
  void,
  { rejectValue: ApiError }
>('admin/fetchAllOrganizations', async (_, { rejectWithValue }) => {
  try {
    return await adminApi.getAllOrganizations();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const fetchOrganizationById = createAsyncThunk<
  OrganizationResponse,
  { id: string },
  { rejectValue: ApiError }
>('admin/fetchOrganizationById', async ({ id }, { rejectWithValue }) => {
  try {
    return await adminApi.getOrganizationById(id);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const updateOrganizationStatus = createAsyncThunk<
  OrganizationResponse,
  { id: string; status: string },
  { rejectValue: ApiError }
>('admin/updateOrganizationStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    return await adminApi.updateOrganizationStatus(id, status);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

// User APIs
export const fetchAllUsers = createAsyncThunk<
  UserProfile[],
  void,
  { rejectValue: ApiError }
>('admin/fetchAllUsers', async (_, { rejectWithValue }) => {
  try {
    return await adminApi.getAllUsers();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const fetchUserById = createAsyncThunk<
  UserProfile,
  { id: string },
  { rejectValue: ApiError }
>('admin/fetchUserById', async ({ id }, { rejectWithValue }) => {
  try {
    return await adminApi.getUserById(id);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError(state) {
      state.organizationError = null;
      state.usersError = null;
      state.selectedOrganizationError = null;
      state.selectedUserError = null;
    },
    clearSelectedOrganization(state) {
      state.selectedOrganization = null;
      state.selectedOrganizationStatus = 'idle';
      state.selectedOrganizationError = null;
    },
    clearSelectedUser(state) {
      state.selectedUser = null;
      state.selectedUserStatus = 'idle';
      state.selectedUserError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all organizations
      .addCase(fetchAllOrganizations.pending, (state) => {
        state.organizationStatus = 'loading';
        state.organizationError = null;
      })
      .addCase(fetchAllOrganizations.fulfilled, (state, action) => {
        state.organizationStatus = 'succeeded';
        state.organizations = action.payload;
      })
      .addCase(fetchAllOrganizations.rejected, (state, action) => {
        state.organizationStatus = 'failed';
        state.organizationError = action.payload || {
          code: 'ADMIN_ORGANIZATIONS_LOAD_FAILED',
          message: action.error.message || 'Unable to load organizations.',
        };
      })

      // Fetch organization by ID
      .addCase(fetchOrganizationById.pending, (state) => {
        state.selectedOrganizationStatus = 'loading';
        state.selectedOrganizationError = null;
      })
      .addCase(fetchOrganizationById.fulfilled, (state, action) => {
        state.selectedOrganizationStatus = 'succeeded';
        state.selectedOrganization = action.payload;
      })
      .addCase(fetchOrganizationById.rejected, (state, action) => {
        state.selectedOrganizationStatus = 'failed';
        state.selectedOrganizationError = action.payload || {
          code: 'ADMIN_ORGANIZATION_LOAD_FAILED',
          message: action.error.message || 'Unable to load organization.',
        };
      })

      // Update organization status
      .addCase(updateOrganizationStatus.pending, (state) => {
        // Don't change status for update to avoid interference
      })
      .addCase(updateOrganizationStatus.fulfilled, (state, action) => {
        // Update the organization in the list
        const index = state.organizations.findIndex(org => org.id === action.payload.id);
        if (index !== -1) {
          state.organizations[index] = action.payload;
        }
        // Also update selected organization if it's the same
        if (state.selectedOrganization?.id === action.payload.id) {
          state.selectedOrganization = action.payload;
        }
      })
      .addCase(updateOrganizationStatus.rejected, (state, action) => {
        // Error handled by UI if needed
      })

      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.usersStatus = 'loading';
        state.usersError = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.usersStatus = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.usersStatus = 'failed';
        state.usersError = action.payload || {
          code: 'ADMIN_USERS_LOAD_FAILED',
          message: action.error.message || 'Unable to load users.',
        };
      })

      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.selectedUserStatus = 'loading';
        state.selectedUserError = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selectedUserStatus = 'succeeded';
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.selectedUserStatus = 'failed';
        state.selectedUserError = action.payload || {
          code: 'ADMIN_USER_LOAD_FAILED',
          message: action.error.message || 'Unable to load user.',
        };
      });
  },
});

export const {
  clearAdminError,
  clearSelectedOrganization,
  clearSelectedUser
} = adminSlice.actions;

// Selectors
interface AdminRootState {
  admin: AdminState;
}

export const selectAllOrganizations = (state: AdminRootState) => state.admin.organizations;
export const selectOrganizationsStatus = (state: AdminRootState) => state.admin.organizationStatus;
export const selectOrganizationsError = (state: AdminRootState) => state.admin.organizationError;

export const selectAllUsers = (state: AdminRootState) => state.admin.users;
export const selectUsersStatus = (state: AdminRootState) => state.admin.usersStatus;
export const selectUsersError = (state: AdminRootState) => state.admin.usersError;

export const selectSelectedOrganization = (state: AdminRootState) => state.admin.selectedOrganization;
export const selectSelectedOrganizationStatus = (state: AdminRootState) => state.admin.selectedOrganizationStatus;
export const selectSelectedOrganizationError = (state: AdminRootState) => state.admin.selectedOrganizationError;

export const selectSelectedUser = (state: AdminRootState) => state.admin.selectedUser;
export const selectSelectedUserStatus = (state: AdminRootState) => state.admin.selectedUserStatus;
export const selectSelectedUserError = (state: AdminRootState) => state.admin.selectedUserError;

export default adminSlice.reducer;