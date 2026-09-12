import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { accountsApi } from '../../api/accountsApi';
import type { Account, CreateAccountDto, UpdateAccountDto, DeleteAccountResponse } from '../../api/accountsTypes';

export interface AccountsState {
  items: Account[];
  selected?: Account;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: AccountsState = {
  items: [],
  status: 'idle',
};

export const createAccount = createAsyncThunk('accounts/create', async (payload: CreateAccountDto) => {
  return await accountsApi.create(payload);
});

// ThunkArg typed as void so dispatch(fetchAccounts()) works without strictNullChecks.
export const fetchAccounts = createAsyncThunk<Account[], void>(
  'accounts/fetchAll',
  async () => {
    return await accountsApi.list();
  },
);

export const fetchAccountById = createAsyncThunk('accounts/fetchById', async (id: string) => {
  return await accountsApi.get(id);
});

export const updateAccount = createAsyncThunk('accounts/update', async ({ id, payload }: { id: string; payload: UpdateAccountDto }) => {
  return await accountsApi.update(id, payload);
});

export const deleteAccount = createAsyncThunk('accounts/delete', async (id: string) => {
  return await accountsApi.remove(id);
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create
    builder.addCase(createAccount.pending, (state) => { state.status = 'loading'; state.error = undefined; });
    builder.addCase(createAccount.fulfilled, (state, action) => { state.status = 'succeeded'; state.items.push(action.payload as Account); });
    builder.addCase(createAccount.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; });
    // List
    builder.addCase(fetchAccounts.pending, (state) => { state.status = 'loading'; state.error = undefined; });
    builder.addCase(fetchAccounts.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      // The backend returns a bare array here (NOT { data: [...] }). The
      // guard keeps items an array even if the shape ever surprises us — a
      // previous version assigned undefined here and crashed .filter() calls
      // in ExpensesView / CatalogView / TransactionsView.
      state.items = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(fetchAccounts.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; });
    // Get by ID
    builder.addCase(fetchAccountById.pending, (state) => { state.status = 'loading'; });
    builder.addCase(fetchAccountById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const acct = action.payload as Account;
      const existing = state.items.find((a) => a.id === acct.id);
      if (existing) Object.assign(existing, acct); else state.items.push(acct);
    });
    builder.addCase(fetchAccountById.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; });
    // Update
    builder.addCase(updateAccount.pending, (state) => { state.status = 'loading'; });
    builder.addCase(updateAccount.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const acct = action.payload as Account;
      const idx = state.items.findIndex((a) => a.id === acct.id);
      if (idx >= 0) state.items[idx] = acct;
    });
    builder.addCase(updateAccount.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; });
    // Delete
    builder.addCase(deleteAccount.pending, (state) => { state.status = 'loading'; });
    builder.addCase(deleteAccount.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const id = action.meta.arg as string;
      state.items = state.items.filter((a) => a.id !== id);
    });
    builder.addCase(deleteAccount.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; });
  },
});

export default accountsSlice.reducer;
