import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { organizationsApi } from '../../api/organizationsApi';
import type {
  ApiError,
  CreateOrganizationRequest,
  OrganizationResponse,
  UpdateOrganizationRequest,
} from '../../api/types';
import { setActiveOrganizationId } from '../../lib/tenantContext';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface OrganizationsState {
  items: OrganizationResponse[];
  currentOrganization: OrganizationResponse | null;
  activeOrganizationId: string | null;
  status: RequestStatus;
  currentStatus: RequestStatus;
  error: ApiError | null;
  // Incremented on tenant switch so tenant-scoped slices can key their reset
  // off a single monotonic value (see resetOnOrganizationChange in each slice).
  organizationDataEpoch: number;
}

const initialState: OrganizationsState = {
  items: [],
  currentOrganization: null,
  activeOrganizationId: null,
  status: 'idle',
  currentStatus: 'idle',
  error: null,
  organizationDataEpoch: 0,
};

export const fetchOrganizations = createAsyncThunk<
  OrganizationResponse[],
  void,
  { rejectValue: ApiError }
>('organizations/fetchOrganizations', async (_, { rejectWithValue }) => {
  try {
    return await organizationsApi.list();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const fetchCurrentOrganization = createAsyncThunk<
  OrganizationResponse,
  void,
  { rejectValue: ApiError }
>('organizations/fetchCurrentOrganization', async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { organizations: OrganizationsState };
    const organizationId = state.organizations.activeOrganizationId;

    if (!organizationId) {
      return rejectWithValue({
        code: 'NO_ACTIVE_ORGANIZATION',
        message: 'Select an organization before loading its details.',
      });
    }

    return await organizationsApi.getCurrent();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const createOrganization = createAsyncThunk<
  OrganizationResponse,
  CreateOrganizationRequest,
  { rejectValue: ApiError }
>('organizations/createOrganization', async (payload, { rejectWithValue }) => {
  try {
    return await organizationsApi.create(payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const updateCurrentOrganization = createAsyncThunk<
  OrganizationResponse,
  UpdateOrganizationRequest,
  { rejectValue: ApiError }
>('organizations/updateCurrentOrganization', async (payload, { rejectWithValue }) => {
  try {
    return await organizationsApi.updateCurrent(payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    selectOrganization(state, action: PayloadAction<string>) {
      const exists = state.items.some((item) => item.id === action.payload);
      if (!exists) {
        return;
      }
      state.activeOrganizationId = action.payload;
      state.currentOrganization =
        state.items.find((item) => item.id === action.payload) || null;
      state.currentStatus = 'succeeded';
      state.error = null;
      setActiveOrganizationId(action.payload);

      // Organization-scoped slices hold the previous tenant's rows. Reset
      // their list state so every consumer re-fetches fresh data for the new
      // tenant (the per-view useEffects re-dispatch once activeOrganizationId
      // changes and the slice status is back to 'idle').
      state.organizationDataEpoch = (state.organizationDataEpoch ?? 0) + 1;
    },
    clearOrganizations(state) {
      state.items = [];
      state.currentOrganization = null;
      state.activeOrganizationId = null;
      state.status = 'idle';
      state.currentStatus = 'idle';
      state.error = null;
      setActiveOrganizationId(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        if (!state.activeOrganizationId && action.payload.length > 0) {
          state.activeOrganizationId = action.payload[0].id;
          setActiveOrganizationId(action.payload[0].id);
        }
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'ORGANIZATIONS_LOAD_FAILED',
          message: action.error.message || 'Unable to load your organizations.',
        };
      })
      .addCase(fetchCurrentOrganization.pending, (state) => {
        state.currentStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentOrganization.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.currentOrganization = action.payload;
        if (state.activeOrganizationId !== action.payload.id) {
          state.activeOrganizationId = action.payload.id;
          setActiveOrganizationId(action.payload.id);
        }
      })
      .addCase(fetchCurrentOrganization.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.error = action.payload || {
          code: 'ORGANIZATION_CURRENT_FAILED',
          message: action.error.message || 'Unable to load the current organization.',
        };
      })
      .addCase(createOrganization.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.unshift(action.payload);
        state.activeOrganizationId = action.payload.id;
        state.currentOrganization = action.payload;
        setActiveOrganizationId(action.payload.id);
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'ORGANIZATION_CREATE_FAILED',
          message: action.error.message || 'Unable to create the organization.',
        };
      })
      .addCase(updateCurrentOrganization.pending, (state) => {
        state.currentStatus = 'loading';
        state.error = null;
      })
      .addCase(updateCurrentOrganization.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.currentOrganization = action.payload;
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(updateCurrentOrganization.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.error = action.payload || {
          code: 'ORGANIZATION_UPDATE_FAILED',
          message: action.error.message || 'Unable to update the organization.',
        };
      });
  },
});

export const { selectOrganization, clearOrganizations } = organizationsSlice.actions;

/**
 * Shared case reducer: clears a tenant-scoped slice whenever the active
 * organization changes or is cleared. Prevents rows from one tenant bleeding
 * into another after a switch (each view then re-fetches for the new tenant).
 */
export const resetOnOrganizationChange = <T extends { items?: unknown[]; error?: unknown; status?: string; list?: unknown[]; listStatus?: string }>(
  state: T,
) => {
  if (Array.isArray(state.items)) {
    state.items = [];
  }
  if ('list' in state && Array.isArray((state as { list?: unknown[] }).list)) {
    (state as { list: unknown[] }).list = [];
  }
  if ('status' in state) {
    (state as { status: string }).status = 'idle';
  }
  if ('listStatus' in state) {
    (state as { listStatus: string }).listStatus = 'idle';
  }
  if ('error' in state) {
    (state as { error: unknown }).error = undefined;
  }
};

export default organizationsSlice.reducer;
