import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { expensesApi } from '../../api/expensesApi';
import {
  resetOnOrganizationChange,
  selectOrganization,
  clearOrganizations,
} from '../organizations/organizationsSlice';
import type {
  Expense,
  CreateExpenseDto,
  PostExpenseDto,
} from '../../api/expensesTypes';

export interface ExpensesState {
  items: Expense[];
  selected?: Expense;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: ExpensesState = {
  items: [],
  status: 'idle',
};

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (payload: CreateExpenseDto) => {
    return await expensesApi.create(payload);
  },
);

// Without strictNullChecks, an optional payloadCreator arg is inferred as a
// required thunk argument, so type ThunkArg explicitly as void to allow
// dispatch(fetchExpenses()).
export const fetchExpenses = createAsyncThunk<Expense[], void>(
  'expenses/fetchAll',
  async () => {
    return await expensesApi.list();
  },
);

export const fetchExpenseById = createAsyncThunk(
  'expenses/fetchById',
  async (id: string) => {
    return await expensesApi.get(id);
  },
);

export const submitExpense = createAsyncThunk(
  'expenses/submit',
  async (id: string) => {
    return await expensesApi.submit(id);
  },
);

export const approveExpense = createAsyncThunk(
  'expenses/approve',
  async (id: string) => {
    return await expensesApi.approve(id);
  },
);

// post requires `paid` (boolean). When paid is true the bank/cash account must
// be provided; the backend books DR expense ÷ CR bank (or CR AP when unpaid).
export const postExpense = createAsyncThunk(
  'expenses/post',
  async ({
    id,
    paid,
    paymentAccountId,
  }: {
    id: string;
    paid: boolean;
    paymentAccountId?: string;
  }) => {
    const payload: PostExpenseDto = {
      paid,
      ...(paymentAccountId ? { paymentAccountId } : {}),
    };
    return await expensesApi.post(id, payload);
  },
);

export const reverseExpense = createAsyncThunk(
  'expenses/reverse',
  async (id: string) => {
    return await expensesApi.reverse(id);
  },
);

export const cancelExpense = createAsyncThunk(
  'expenses/cancel',
  async (id: string) => {
    return await expensesApi.cancel(id);
  },
);

const upsertExpense = (state: ExpensesState, expense: Expense) => {
  const idx = state.items.findIndex((e) => e.id === expense.id);
  if (idx >= 0) {
    state.items[idx] = expense;
  } else {
    state.items.unshift(expense);
  }
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Tenant switch: drop the previous organization's rows so no stale data
    // from another tenant is ever rendered or mixed into metrics.
    builder.addCase(selectOrganization, resetOnOrganizationChange);
    builder.addCase(clearOrganizations, resetOnOrganizationChange);
    // Create (backend assigns the immutable expense number + status DRAFT)
    builder.addCase(createExpense.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createExpense.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      upsertExpense(state, action.payload);
    });
    builder.addCase(createExpense.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // List — the backend returns a bare Expense[] inside { success, data }
    builder.addCase(fetchExpenses.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchExpenses.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.items = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(fetchExpenses.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Get by ID (refresh `selected` + upsert into the list)
    builder.addCase(fetchExpenseById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchExpenseById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.selected = action.payload;
      upsertExpense(state, action.payload);
    });
    builder.addCase(fetchExpenseById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Submit (DRAFT only per backend business rules)
    builder.addCase(submitExpense.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(submitExpense.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertExpense(state, action.payload);
    });
    builder.addCase(submitExpense.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Approve (SUBMITTED only per backend business rules)
    builder.addCase(approveExpense.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(approveExpense.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertExpense(state, action.payload);
    });
    builder.addCase(approveExpense.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Post (APPROVED only; books the journal entry and sets POSTED)
    builder.addCase(postExpense.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(postExpense.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertExpense(state, action.payload);
    });
    builder.addCase(postExpense.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Reverse (POSTED only; reverses the journal entry)
    builder.addCase(reverseExpense.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(reverseExpense.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertExpense(state, action.payload);
    });
    builder.addCase(reverseExpense.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Cancel (DRAFT/SUBMITTED/APPROVED/REJECTED only per backend rules)
    builder.addCase(cancelExpense.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(cancelExpense.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertExpense(state, action.payload);
    });
    builder.addCase(cancelExpense.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default expensesSlice.reducer;
