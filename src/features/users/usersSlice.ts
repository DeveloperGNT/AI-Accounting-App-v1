import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { usersApi } from '../../api/usersApi';
import type { ApiError, UpdateUserProfileRequest, UserProfile } from '../../api/types';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface UsersState {
  currentProfile: UserProfile | null;
  status: RequestStatus;
  error: ApiError | null;
}

const initialState: UsersState = {
  currentProfile: null,
  status: 'idle',
  error: null,
};

export const fetchCurrentUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: ApiError }
>('users/fetchCurrentUserProfile', async (_, { rejectWithValue }) => {
  try {
    return await usersApi.getCurrentProfile();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const updateCurrentUserProfile = createAsyncThunk<
  UserProfile,
  UpdateUserProfileRequest,
  { rejectValue: ApiError }
>('users/updateCurrentUserProfile', async (payload, { rejectWithValue }) => {
  try {
    return await usersApi.updateCurrentProfile(payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserProfile(state) {
      state.currentProfile = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(fetchCurrentUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'PROFILE_REQUEST_FAILED',
          message: action.error.message || 'Unable to load the current user profile.',
        };
      })
      .addCase(updateCurrentUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateCurrentUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(updateCurrentUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'PROFILE_UPDATE_FAILED',
          message: action.error.message || 'Unable to update the current user profile.',
        };
      });
  },
});

export const { clearUserProfile } = usersSlice.actions;
export default usersSlice.reducer;