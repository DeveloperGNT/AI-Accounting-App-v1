import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { vendorPaymentsApi } from '../../api/vendorPaymentsApi';
import {
  resetOnOrganizationChange,
  selectOrganization,
  clearOrganizations,
} from '../organizations/organizationsSlice';
import type {
  VendorPayment,
  CreateVendorPaymentDto,
  PostVendorPaymentDto,
} from '../../api/vendorPaymentsTypes';

export interface VendorPaymentsState {
  items: VendorPayment[];
  selected?: VendorPayment;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: VendorPaymentsState = {
  items: [],
  status: 'idle',
};

export const createVendorPayment = createAsyncThunk(
  'vendorPayments/create',
  async (payload: CreateVendorPaymentDto) => {
    return await vendorPaymentsApi.create(payload);
  },
);

// Without strictNullChecks, an optional payloadCreator arg is inferred as a
// required thunk argument, so type ThunkArg explicitly as void to allow
// dispatch(fetchVendorPayments()).
export const fetchVendorPayments = createAsyncThunk<VendorPayment[], void>(
  'vendorPayments/fetchAll',
  async () => {
    return await vendorPaymentsApi.list();
  },
);

export const fetchVendorPaymentById = createAsyncThunk(
  'vendorPayments/fetchById',
  async (id: string) => {
    return await vendorPaymentsApi.get(id);
  },
);

// post requires the paying (bank/cash) account: body { paymentAccountId }
export const postVendorPayment = createAsyncThunk(
  'vendorPayments/post',
  async ({ id, paymentAccountId }: { id: string; paymentAccountId: string }) => {
    const payload: PostVendorPaymentDto = { paymentAccountId };
    return await vendorPaymentsApi.post(id, payload);
  },
);

export const voidVendorPayment = createAsyncThunk(
  'vendorPayments/void',
  async (id: string) => {
    return await vendorPaymentsApi.void(id);
  },
);

const upsertVendorPayment = (state: VendorPaymentsState, payment: VendorPayment) => {
  const idx = state.items.findIndex((p) => p.id === payment.id);
  if (idx >= 0) {
    state.items[idx] = payment;
  } else {
    state.items.unshift(payment);
  }
};

const vendorPaymentsSlice = createSlice({
  name: 'vendorPayments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Tenant switch: drop the previous organization's vendor payments.
    builder.addCase(selectOrganization, resetOnOrganizationChange);
    builder.addCase(clearOrganizations, resetOnOrganizationChange);
    // Create (backend assigns paymentNumber and status DRAFT)
    builder.addCase(createVendorPayment.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createVendorPayment.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      upsertVendorPayment(state, action.payload);
    });
    builder.addCase(createVendorPayment.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // List
    builder.addCase(fetchVendorPayments.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchVendorPayments.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.error = undefined;
      state.items = action.payload;
    });
    builder.addCase(fetchVendorPayments.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Get by ID (refresh `selected` + upsert into the list)
    builder.addCase(fetchVendorPaymentById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchVendorPaymentById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.selected = action.payload;
      upsertVendorPayment(state, action.payload);
    });
    builder.addCase(fetchVendorPaymentById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Post (books the journal entry via the backend payment engine)
    builder.addCase(postVendorPayment.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(postVendorPayment.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertVendorPayment(state, action.payload);
    });
    builder.addCase(postVendorPayment.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Void (POSTED only per backend rules; reverses the journal entry)
    builder.addCase(voidVendorPayment.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(voidVendorPayment.fulfilled, (state, action) => {
      state.status = 'succeeded';
      upsertVendorPayment(state, action.payload);
    });
    builder.addCase(voidVendorPayment.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default vendorPaymentsSlice.reducer;
