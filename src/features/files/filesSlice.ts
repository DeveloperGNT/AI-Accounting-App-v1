import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { filesApi } from '../../api/filesApi';
import type { FileRecord, UploadFileResponse, DownloadUrlResponse, LinkFilePayload } from '../../api/filesTypes';
import { unwrapApiResponse } from '../../api/response';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';

// Define the state interface
interface FilesState {
  items: FileRecord[];
  selectedItem: FileRecord | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  uploadStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  uploadError: string | null;
  downloadUrlStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  downloadUrlError: string | null;
  linkStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  linkError: string | null;
}

// Initial state
const initialState: FilesState = {
  items: [],
  selectedItem: null,
  status: 'idle',
  error: null,
  uploadStatus: 'idle',
  uploadError: null,
  downloadUrlStatus: 'idle',
  downloadUrlError: null,
  linkStatus: 'idle',
  linkError: null,
};

// Thunk for uploading a file
export const uploadFile = createAsyncThunk<
  UploadFileResponse,
  { organizationId: string; file: File },
  { rejectValue: string }
>('files/uploadFile', async ({ organizationId, file }, { rejectWithValue }) => {
  try {
    return await filesApi.uploadFile(organizationId, file);
  } catch (error) {
    // Surface the real backend error (bucket/storage/config failures) instead
    // of a generic string that masks the root cause.
    return rejectWithValue(getApiErrorMessage(error, 'Failed to upload file'));
  }
});

// Thunk for fetching file by ID
export const fetchFileById = createAsyncThunk<
  FileRecord,
  { organizationId: string; fileId: string },
  { rejectValue: string }
>('files/fetchFileById', async ({ organizationId, fileId }, { rejectWithValue }) => {
  try {
    return await filesApi.getFile(organizationId, fileId);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch file'));
  }
});

// Thunk for deleting a file
export const deleteFile = createAsyncThunk<
  string,
  { organizationId: string; fileId: string },
  { rejectValue: string }
>('files/deleteFile', async ({ organizationId, fileId }, { rejectWithValue }) => {
  try {
    await filesApi.deleteFile(organizationId, fileId);
    return fileId;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to delete file'));
  }
});

// Thunk for getting download URL
export const fetchDownloadUrl = createAsyncThunk<
  DownloadUrlResponse,
  { organizationId: string; fileId: string },
  { rejectValue: string }
>('files/fetchDownloadUrl', async ({ organizationId, fileId }, { rejectWithValue }) => {
  try {
    return await filesApi.getDownloadUrl(organizationId, fileId);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to get download URL'));
  }
});

// Thunk for linking a file
export const linkFile = createAsyncThunk<
  { fileId: string; response: any },
  { organizationId: string; fileId: string; payload: any },
  { rejectValue: string }
>('files/linkFile', async ({ organizationId, fileId, payload }, { rejectWithValue }) => {
  try {
    const response = await filesApi.linkFile(organizationId, fileId, payload);
    return { fileId, response };
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to link file'));
  }
});

// Files slice
export const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearSelectedFile: (state) => {
      state.selectedItem = null;
    },
    clearUploadStatus: (state) => {
      state.uploadStatus = 'idle';
      state.uploadError = null;
    },
    clearDownloadUrlStatus: (state) => {
      state.downloadUrlStatus = 'idle';
      state.downloadUrlError = null;
    },
    clearLinkStatus: (state) => {
      state.linkStatus = 'idle';
      state.linkError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.uploadStatus = 'loading';
        state.uploadError = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded';
        // Add the uploaded file to the list
        state.items.unshift(action.payload.file);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError = action.payload || 'Failed to upload file';
      })

      // Fetch file by ID
      .addCase(fetchFileById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFileById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedItem = action.payload;
      })
      .addCase(fetchFileById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch file';
      })

      // Delete file
      .addCase(deleteFile.pending, (state) => {
        // Status will be handled by the component if needed
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        // Remove the deleted file from the list
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete file';
      })

      // Fetch download URL
      .addCase(fetchDownloadUrl.pending, (state) => {
        state.downloadUrlStatus = 'loading';
        state.downloadUrlError = null;
      })
      .addCase(fetchDownloadUrl.fulfilled, (state, action) => {
        state.downloadUrlStatus = 'succeeded';
      })
      .addCase(fetchDownloadUrl.rejected, (state, action) => {
        state.downloadUrlStatus = 'failed';
        state.downloadUrlError = action.payload || 'Failed to get download URL';
      })

      // Link file
      .addCase(linkFile.pending, (state) => {
        state.linkStatus = 'loading';
        state.linkError = null;
      })
      .addCase(linkFile.fulfilled, (state, action) => {
        state.linkStatus = 'succeeded';
        // Optionally update the file with link info if needed
      })
      .addCase(linkFile.rejected, (state, action) => {
        state.linkStatus = 'failed';
        state.linkError = action.payload || 'Failed to link file';
      });
  },
});

// Action creators
export const { clearSelectedFile, clearUploadStatus, clearDownloadUrlStatus, clearLinkStatus } = filesSlice.actions;

// Selectors
export const selectFiles = (state: RootState) => state.files.items;
export const selectFileById = (state: RootState, fileId: string) =>
  state.files.items.find(file => file.id === fileId) || null;
export const selectSelectedFile = (state: RootState) => state.files.selectedItem;
export const selectFilesStatus = (state: RootState) => state.files.status;
export const selectFilesError = (state: RootState) => state.files.error;
export const selectUploadStatus = (state: RootState) => state.files.uploadStatus;
export const selectUploadError = (state: RootState) => state.files.uploadError;
export const selectDownloadUrlStatus = (state: RootState) => state.files.downloadUrlStatus;
export const selectDownloadUrlError = (state: RootState) => state.files.downloadUrlError;
export const selectLinkStatus = (state: RootState) => state.files.linkStatus;
export const selectLinkError = (state: RootState) => state.files.linkError;

export default filesSlice.reducer;