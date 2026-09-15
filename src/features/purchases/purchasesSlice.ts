import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { purchasesApi } from '../../api/purchasesApi';
import type {
  PurchaseBill,
  CreatePurchaseBillDto,
  UpdatePurchaseBillDto,
} from '../../api/purchasesTypes';

export interface PurchasesState {
  items: PurchaseBill[];
  selected?: PurchaseBill;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: PurchasesState = {
  items: [],
  status: 'idle',
};

export const createBill = createAsyncThunk(
  'purchases/create',
  async (payload: CreatePurchaseBillDto) => {
    return await purchasesApi.create(payload);
  },
);

// Without strictNullChecks, an optional payloadCreator arg is inferred as a
// required thunk argument, so type ThunkArg explicitly as void to allow
// dispatch(fetchBills()).
export const fetchBills = createAsyncThunk<PurchaseBill[], void>(
  'purchases/fetchAll',
  async () => {
    return await purchasesApi.list();
  },
);

export const fetchBillById = createAsyncThunk(
  'purchases/fetchById',
  async (id: string) => {
    return await purchasesApi.get(id);
  },
);

export const updateBill = createAsyncThunk(
  'purchases/update',
  async ({ id, payload }: { id: string; payload: UpdatePurchaseBillDto }) => {
    return await purchasesApi.update(id, payload);
  },
);

export const deleteBill = createAsyncThunk(
  'purchases/delete',
  async (id: string) => {
    return await purchasesApi.remove(id);
  },
);

export const finalizeBill = createAsyncThunk(
  'purchases/finalize',
  async (id: string) => {
    return await purchasesApi.finalize(id);
  },
);

export const cancelBill = createAsyncThunk(
  'purchases/cancel',
  async (id: string) => {
    return await purchasesApi.cancel(id);
  },
);

const upsertBill = (state: PurchasesState, bill: PurchaseBill) => {
  const idx = state.items.findIndex((b) => b.id === bill.id);
  if (idx >= 0) {
    state.items[idx] = bill;
  } else {
    state.items.unshift(bill);
  }
};

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create (backend assigns billNumber DRAFT-<timestamp> and status DRAFT)
    builder.addCase(createBill.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createBill.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      upsertBill(state, action.payload);
    });
    builder.addCase(createBill.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // List — the backend returns a bare PurchaseBill[] inside { success, data }
    builder.addCase(fetchBills.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchBills.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.items = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(fetchBills.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Get by ID (refresh `selected` + upsert into the list)
    builder.addCase(fetchBillById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchBillById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.selected = action.payload;
      upsertBill(state, action.payload);
    });
    builder.addCase(fetchBillById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Update (DRAFT only per backend business rules)
    builder.addCase(updateBill.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(updateBill.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertBill(state, action.payload);
    });
    builder.addCase(updateBill.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Delete (DRAFT only per backend business rules)
    builder.addCase(deleteBill.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(deleteBill.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const id = action.meta.arg as string;
      state.items = state.items.filter((b) => b.id !== id);
      if (state.selected?.id === id) delete state.selected;
    });
    builder.addCase(deleteBill.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Finalize (generates bill number + posts the journal entry)
    builder.addCase(finalizeBill.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(finalizeBill.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertBill(state, action.payload);
    });
    builder.addCase(finalizeBill.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Cancel (FINALIZED only per backend business rules)
    builder.addCase(cancelBill.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(cancelBill.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertBill(state, action.payload);
    });
    builder.addCase(cancelBill.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default purchasesSlice.reducer;
