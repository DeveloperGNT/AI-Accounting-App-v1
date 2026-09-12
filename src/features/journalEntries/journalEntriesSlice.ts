import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { journalEntriesApi } from '../../api/journalEntriesApi';
import type {
  JournalEntry,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  PostJournalEntryResponse,
  ReverseJournalEntryResponse,
} from '../../api/journalEntriesTypes';

export interface JournalEntriesState {
  items: JournalEntry[];
  selected?: JournalEntry;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: JournalEntriesState = {
  items: [],
  status: 'idle',
};

// Create a draft journal entry
export const createJournalEntry = createAsyncThunk(
  'journalEntries/create',
  async (payload: CreateJournalEntryDto) => {
    return await journalEntriesApi.create(payload);
  },
);

// Fetch all journal entries. ThunkArg typed as void so dispatch(fetchJournalEntries())
// works without strictNullChecks. Return type annotated explicitly so the payload
// is typed as JournalEntry[] instead of unknown.
export const fetchJournalEntries = createAsyncThunk<JournalEntry[], void>(
  'journalEntries/fetchAll',
  async (): Promise<JournalEntry[]> => {
    return await journalEntriesApi.list();
  },
);

// Fetch a single journal entry by id
export const fetchJournalEntryById = createAsyncThunk(
  'journalEntries/fetchById',
  async (id: string) => {
    return await journalEntriesApi.get(id);
  },
);

// Post (finalize) a draft entry
export const postJournalEntry = createAsyncThunk(
  'journalEntries/post',
  async (id: string) => {
    return await journalEntriesApi.post(id);
  },
);

// Reverse a posted entry
export const reverseJournalEntry = createAsyncThunk(
  'journalEntries/reverse',
  async (id: string) => {
    return await journalEntriesApi.reverse(id);
  },
);

const journalEntriesSlice = createSlice({
  name: 'journalEntries',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create
    builder.addCase(createJournalEntry.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createJournalEntry.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.items.push(action.payload as JournalEntry);
    });
    builder.addCase(createJournalEntry.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // List
    builder.addCase(fetchJournalEntries.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchJournalEntries.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      // The backend returns a bare array here (NOT { data: [...] }). The
      // guard keeps items an array even if the shape ever surprises us.
      state.items = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(fetchJournalEntries.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // Get by ID
    builder.addCase(fetchJournalEntryById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchJournalEntryById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const entry = action.payload as JournalEntry;
      const existing = state.items.find((e) => e.id === entry.id);
      if (existing) {
        Object.assign(existing, entry);
      } else {
        state.items.push(entry);
      }
    });
    builder.addCase(fetchJournalEntryById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // Post
    builder.addCase(postJournalEntry.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(postJournalEntry.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const entry = (action.payload as PostJournalEntryResponse).data;
      const idx = state.items.findIndex((e) => e.id === entry.id);
      if (idx >= 0) state.items[idx] = entry;
    });
    builder.addCase(postJournalEntry.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // Reverse
    builder.addCase(reverseJournalEntry.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(reverseJournalEntry.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const entry = (action.payload as ReverseJournalEntryResponse).data;
      const idx = state.items.findIndex((e) => e.id === entry.id);
      if (idx >= 0) state.items[idx] = entry;
    });
    builder.addCase(reverseJournalEntry.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default journalEntriesSlice.reducer;
