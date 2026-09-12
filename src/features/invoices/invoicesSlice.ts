import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { invoicesApi } from '../../api/invoicesApi';
import type {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  DeleteInvoiceResponse,
} from '../../api/invoicesTypes';

export interface InvoicesState {
  items: Invoice[];
  selected?: Invoice;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: InvoicesState = {
  items: [],
  status: 'idle',
};

export const createInvoice = createAsyncThunk('invoices/create', async (payload: CreateInvoiceDto) => {
  return await invoicesApi.create(payload);
});

// Without strictNullChecks, an optional payloadCreator arg is inferred as a
// required thunk argument, so type ThunkArg explicitly as void to allow
// dispatch(fetchInvoices()).
export const fetchInvoices = createAsyncThunk<Invoice[], void>('invoices/fetchAll', async () => {
  return await invoicesApi.list();
});

export const fetchInvoiceById = createAsyncThunk('invoices/fetchById', async (id: string) => {
  return await invoicesApi.get(id);
});

export const updateInvoice = createAsyncThunk('invoices/update', async ({ id, payload }: { id: string; payload: UpdateInvoiceDto }) => {
  return await invoicesApi.update(id, payload);
});

export const deleteInvoice = createAsyncThunk('invoices/delete', async (id: string) => {
  return await invoicesApi.remove(id);
});

export const finalizeInvoice = createAsyncThunk('invoices/finalize', async (id: string) => {
  return await invoicesApi.finalize(id);
});

export const cancelInvoice = createAsyncThunk('invoices/cancel', async (id: string) => {
  return await invoicesApi.cancel(id);
});

const upsertInvoice = (state: InvoicesState, invoice: Invoice) => {
  const idx = state.items.findIndex((i) => i.id === invoice.id);
  if (idx >= 0) {
    state.items[idx] = invoice;
  } else {
    state.items.unshift(invoice);
  }
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create
    builder.addCase(createInvoice.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createInvoice.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      upsertInvoice(state, action.payload);
    });
    builder.addCase(createInvoice.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // List
    builder.addCase(fetchInvoices.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchInvoices.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.items = action.payload;
    });
    builder.addCase(fetchInvoices.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Get by ID (refresh `selected` + upsert into the list)
    builder.addCase(fetchInvoiceById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchInvoiceById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.selected = action.payload;
      upsertInvoice(state, action.payload);
    });
    builder.addCase(fetchInvoiceById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Update
    builder.addCase(updateInvoice.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(updateInvoice.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertInvoice(state, action.payload);
    });
    builder.addCase(updateInvoice.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Delete (DRAFT only per backend business rules)
    builder.addCase(deleteInvoice.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(deleteInvoice.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const id = action.meta.arg as string;
      state.items = state.items.filter((i) => i.id !== id);
      if (state.selected?.id === id) delete state.selected;
    });
    builder.addCase(deleteInvoice.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Finalize (generates invoice number + posts the journal entry)
    builder.addCase(finalizeInvoice.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(finalizeInvoice.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertInvoice(state, action.payload);
    });
    builder.addCase(finalizeInvoice.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Cancel (FINALIZED only per backend business rules)
    builder.addCase(cancelInvoice.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(cancelInvoice.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertInvoice(state, action.payload);
    });
    builder.addCase(cancelInvoice.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default invoicesSlice.reducer;
