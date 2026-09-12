import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { paymentsApi } from '../../api/paymentsApi';
import type { Payment, CreatePaymentDto } from '../../api/paymentsTypes';

export interface PaymentsState {
  // The backend exposes no GET /payments list endpoint (only create/post/
  // void), so this slice tracks payments the UI has created or mutated in
  // this session rather than a server-fetched collection.
  items: Payment[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: PaymentsState = {
  items: [],
  status: 'idle',
};

export const createPayment = createAsyncThunk('payments/create', async (payload: CreatePaymentDto) => {
  return await paymentsApi.create(payload);
});

export const postPayment = createAsyncThunk('payments/post', async (id: string) => {
  return await paymentsApi.post(id);
});

export const voidPayment = createAsyncThunk('payments/void', async (id: string) => {
  return await paymentsApi.void(id);
});

const upsertPayment = (state: PaymentsState, payment: Payment) => {
  const idx = state.items.findIndex((p) => p.id === payment.id);
  if (idx >= 0) {
    state.items[idx] = payment;
  } else {
    state.items.unshift(payment);
  }
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create (backend assigns paymentNumber PAY-YYYY-#### and status DRAFT)
    builder.addCase(createPayment.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createPayment.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      upsertPayment(state, action.payload);
    });
    builder.addCase(createPayment.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Post (allocates against invoices, posts the journal entry, and returns
    // the payment with allocations; invoice statuses change server-side)
    builder.addCase(postPayment.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(postPayment.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertPayment(state, action.payload);
    });
    builder.addCase(postPayment.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Void (POSTED only per backend rules; reverses the journal entry)
    builder.addCase(voidPayment.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(voidPayment.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertPayment(state, action.payload);
    });
    builder.addCase(voidPayment.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default paymentsSlice.reducer;
