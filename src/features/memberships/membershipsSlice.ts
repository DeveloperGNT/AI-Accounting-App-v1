import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ApiError } from '../../api/types';
import { membershipsApi } from '../../api/membershipsApi';
import type {
  Membership,
  InvitationPreviewResponse,
  InvitationCreateResponse,
  InvitationAcceptResponse,
  PreviewInvitationDto,
  AcceptInvitationDto,
  CreateInvitationDto,
  UpdateMemberRoleDto,
} from '../../api/membershipsTypes';

// Thunks definitions moved here
export const previewInvitation = createAsyncThunk<
  InvitationPreviewResponse,
  PreviewInvitationDto,
  { rejectValue: ApiError }
>('memberships/previewInvitation', async (payload, { rejectWithValue }) => {
  try {
    return await membershipsApi.previewInvitation(payload);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const acceptInvitation = createAsyncThunk<
  InvitationAcceptResponse,
  AcceptInvitationDto,
  { rejectValue: ApiError }
>('memberships/acceptInvitation', async (payload, { rejectWithValue }) => {
  try {
    return await membershipsApi.acceptInvitation(payload);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const createInvitation = createAsyncThunk<
  InvitationCreateResponse,
  CreateInvitationDto,
  { rejectValue: ApiError }
>('memberships/createInvitation', async (payload, { rejectWithValue }) => {
  try {
    return await membershipsApi.createInvitation(payload);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const fetchMemberships = createAsyncThunk<
  Membership[],
  void,
  { rejectValue: ApiError }
>('memberships/fetchMemberships', async (_, { rejectWithValue }) => {
  try {
    return await membershipsApi.list();
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const updateMemberRole = createAsyncThunk<
  { message: string },
  { id: string; payload: UpdateMemberRoleDto },
  { rejectValue: ApiError }
>('memberships/updateMemberRole', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await membershipsApi.updateRole(id, payload);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const transferMembershipOwnership = createAsyncThunk<
  { message: string },
  { id: string },
  { rejectValue: ApiError }
>('memberships/transferOwnership', async ({ id }, { rejectWithValue }) => {
  try {
    return await membershipsApi.transferOwnership(id);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const deleteMembership = createAsyncThunk<
  { message: string },
  { id: string },
  { rejectValue: ApiError }
>('memberships/deleteMembership', async ({ id }, { rejectWithValue }) => {
  try {
    return await membershipsApi.delete(id);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});


type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface MembershipsState {
  list: Membership[];
  preview?: InvitationPreviewResponse;
  invitationResult?: InvitationCreateResponse;
  acceptResult?: InvitationAcceptResponse;
  // overall generic status/error could be used for UI but we also track per-action
  status: RequestStatus;
  error: ApiError | null;
  listStatus: RequestStatus;
  previewStatus: RequestStatus;
  createStatus: RequestStatus;
  acceptStatus: RequestStatus;
  updateRoleStatus: RequestStatus;
  transferStatus: RequestStatus;
  deleteStatus: RequestStatus;
}

const initialState: MembershipsState = {
  list: [],
  status: 'idle',
  error: null,
  listStatus: 'idle',
  previewStatus: 'idle',
  createStatus: 'idle',
  acceptStatus: 'idle',
  updateRoleStatus: 'idle',
  transferStatus: 'idle',
  deleteStatus: 'idle',
};

const membershipsSlice = createSlice({
  name: 'memberships',
  initialState,
  reducers: {
    clearMemberships(state) {
      state.list = [];
      state.preview = undefined;
      state.invitationResult = undefined;
      state.acceptResult = undefined;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch list
    builder
      .addCase(fetchMemberships.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchMemberships.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchMemberships.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload || {
          code: 'FETCH_MEMBERS_FAILED',
          message: action.error.message || 'Failed to fetch memberships',
        };
      })
      // Preview invitation
      .addCase(previewInvitation.pending, (state) => {
        state.previewStatus = 'loading';
        state.error = null;
      })
      .addCase(previewInvitation.fulfilled, (state, action) => {
        state.previewStatus = 'succeeded';
        state.preview = action.payload;
      })
      .addCase(previewInvitation.rejected, (state, action) => {
        state.previewStatus = 'failed';
        state.error = action.payload || {
          code: 'PREVIEW_INVITATION_FAILED',
          message: action.error.message || 'Failed to preview invitation',
        };
      })
      // Create invitation
      .addCase(createInvitation.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createInvitation.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.invitationResult = action.payload;
      })
      .addCase(createInvitation.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload || {
          code: 'CREATE_INVITATION_FAILED',
          message: action.error.message || 'Failed to create invitation',
        };
      })
      // Accept invitation
      .addCase(acceptInvitation.pending, (state) => {
        state.acceptStatus = 'loading';
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.acceptStatus = 'succeeded';
        state.acceptResult = action.payload;
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.acceptStatus = 'failed';
        state.error = action.payload || {
          code: 'ACCEPT_INVITATION_FAILED',
          message: action.error.message || 'Failed to accept invitation',
        };
      })
      // Update member role
      .addCase(updateMemberRole.pending, (state) => {
        state.updateRoleStatus = 'loading';
        state.error = null;
      })
      .addCase(updateMemberRole.fulfilled, (state) => {
        state.updateRoleStatus = 'succeeded';
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.updateRoleStatus = 'failed';
        state.error = action.payload || {
          code: 'UPDATE_ROLE_FAILED',
          message: action.error.message || 'Failed to update member role',
        };
      })
      // Transfer ownership
      .addCase(transferMembershipOwnership.pending, (state) => {
        state.transferStatus = 'loading';
        state.error = null;
      })
      .addCase(transferMembershipOwnership.fulfilled, (state) => {
        state.transferStatus = 'succeeded';
      })
      .addCase(transferMembershipOwnership.rejected, (state, action) => {
        state.transferStatus = 'failed';
        state.error = action.payload || {
          code: 'TRANSFER_OWNERSHIP_FAILED',
          message: action.error.message || 'Failed to transfer ownership',
        };
      })
      // Delete membership
      .addCase(deleteMembership.pending, (state) => {
        state.deleteStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteMembership.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        // Optionally remove from list if we have id in meta (payload does not include id). Caller should refetch.
      })
      .addCase(deleteMembership.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload || {
          code: 'DELETE_MEMBERSHIP_FAILED',
          message: action.error.message || 'Failed to delete membership',
        };
      });
  },
});

export const { clearMemberships } = membershipsSlice.actions;
export default membershipsSlice.reducer;
