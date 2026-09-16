import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { aiApi } from '../../api/aiApi';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import type { AiChatResponse, AiExtractionProposal, AiAuditLog } from '../../api/aiTypes';

// Define the state interface
interface AiState {
  // Chat
  chatStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  chatError: string | null;

  // Extract bill
  extractStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  extractError: string | null;
  extractionProposal: AiExtractionProposal | null;

  // Audit logs
  auditLogs: AiAuditLog[];
  auditStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  auditError: string | null;

  // Pagination for audit logs
  auditLimit: number;
  auditOffset: number;
  hasMoreAuditLogs: boolean;
}

// Initial state
const initialState: AiState = {
  // Chat
  chatStatus: 'idle',
  chatError: null,

  // Extract bill
  extractStatus: 'idle',
  extractError: null,
  extractionProposal: null,

  // Audit logs
  auditLogs: [],
  auditStatus: 'idle',
  auditError: null,
  auditLimit: 20,
  auditOffset: 0,
  hasMoreAuditLogs: false,
};

// Thunk for AI chat
export const chatAi = createAsyncThunk<
  AiChatResponse,
  { organizationId: string; query: string },
  { rejectValue: string }
>('ai/chatAi', async ({ organizationId, query }, { rejectWithValue }) => {
  try {
    return await aiApi.chatAi(organizationId, query);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to get AI response'));
  }
});

// Thunk for AI bill extraction
export const extractBill = createAsyncThunk<
  AiExtractionProposal,
  { organizationId: string; fileId: string },
  { rejectValue: string }
>('ai/extractBill', async ({ organizationId, fileId }, { rejectWithValue }) => {
  try {
    return await aiApi.extractBill(organizationId, fileId);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to extract bill'));
  }
});

// Thunk for fetching AI audit logs
export const fetchAiAuditLogs = createAsyncThunk<
  { logs: AiAuditLog[]; hasMore: boolean },
  { organizationId: string; limit?: number; offset?: number },
  { rejectValue: string }
>('ai/fetchAiAuditLogs', async ({ organizationId, limit, offset }, { rejectWithValue }) => {
  try {
    const logs = await aiApi.fetchAiAuditLogs(
      organizationId,
      limit ?? 20,
      offset ?? 0
    );

    // Determine if there are more logs available
    const hasMore = logs.length === (limit ?? 20);

    return { logs, hasMore };
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch AI audit logs'));
  }
});

// AI slice
export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    // Chat reducers
    clearChatError: (state) => {
      state.chatError = null;
    },
    clearChatStatus: (state) => {
      state.chatStatus = 'idle';
    },

    // Extract bill reducers
    clearExtractError: (state) => {
      state.extractError = null;
    },
    clearExtractStatus: (state) => {
      state.extractStatus = 'idle';
    },
    clearExtractionProposal: (state) => {
      state.extractionProposal = null;
    },

    // Audit logs reducers
    clearAuditError: (state) => {
      state.auditError = null;
    },
    clearAuditStatus: (state) => {
      state.auditStatus = 'idle';
    },
    setAuditLimitOffset: (state, action: PayloadAction<{ limit: number; offset: number }>) => {
      state.auditLimit = action.payload.limit;
      state.auditOffset = action.payload.offset;
    },
    appendAuditLogs: (state, action: PayloadAction<{ logs: AiAuditLog[]; hasMore: boolean }>) => {
      state.auditLogs = [...state.auditLogs, ...action.payload.logs];
      state.hasMoreAuditLogs = action.payload.hasMore;
    },
    resetAuditLogs: (state) => {
      state.auditLogs = [];
      state.auditOffset = 0;
      state.hasMoreAuditLogs = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // AI Chat
      .addCase(chatAi.pending, (state) => {
        state.chatStatus = 'loading';
        state.chatError = null;
      })
      .addCase(chatAi.fulfilled, (state, action) => {
        state.chatStatus = 'succeeded';
      })
      .addCase(chatAi.rejected, (state, action) => {
        state.chatStatus = 'failed';
        state.chatError = action.payload || 'Failed to get AI response';
      })

      // AI Extract Bill
      .addCase(extractBill.pending, (state) => {
        state.extractStatus = 'loading';
        state.extractError = null;
        state.extractionProposal = null;
      })
      .addCase(extractBill.fulfilled, (state, action) => {
        state.extractStatus = 'succeeded';
        state.extractionProposal = action.payload;
      })
      .addCase(extractBill.rejected, (state, action) => {
        state.extractStatus = 'failed';
        state.extractError = action.payload || 'Failed to extract bill';
      })

      // AI Audit Logs
      .addCase(fetchAiAuditLogs.pending, (state) => {
        state.auditStatus = 'loading';
        state.auditError = null;
      })
      .addCase(fetchAiAuditLogs.fulfilled, (state, action) => {
        state.auditStatus = 'succeeded';
        // Don't replace existing logs when fetching more - append instead
        if (state.auditOffset === 0) {
          state.auditLogs = action.payload.logs;
        } else {
          state.auditLogs = [...state.auditLogs, ...action.payload.logs];
        }
        state.hasMoreAuditLogs = action.payload.hasMore;
      })
      .addCase(fetchAiAuditLogs.rejected, (state, action) => {
        state.auditStatus = 'failed';
        state.auditError = action.payload || 'Failed to fetch AI audit logs';
      });
  },
});

// Action creators
export const {
  clearChatError,
  clearChatStatus,
  clearExtractError,
  clearExtractStatus,
  clearExtractionProposal,
  clearAuditError,
  clearAuditStatus,
  setAuditLimitOffset,
  appendAuditLogs,
  resetAuditLogs
} = aiSlice.actions;

// Selectors
export const selectChatStatus = (state: RootState) => state.ai.chatStatus;
export const selectChatError = (state: RootState) => state.ai.chatError;
export const selectExtractStatus = (state: RootState) => state.ai.extractStatus;
export const selectExtractError = (state: RootState) => state.ai.extractError;
export const selectExtractionProposal = (state: RootState) => state.ai.extractionProposal;
export const selectAuditLogs = (state: RootState) => state.ai.auditLogs;
export const selectAuditStatus = (state: RootState) => state.ai.auditStatus;
export const selectAuditError = (state: RootState) => state.ai.auditError;
export const selectHasMoreAuditLogs = (state: RootState) => state.ai.hasMoreAuditLogs;

export default aiSlice.reducer;