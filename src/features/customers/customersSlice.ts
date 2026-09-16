import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { customersApi } from '../../api/customersApi';
import {
  resetOnOrganizationChange,
  selectOrganization,
  clearOrganizations,
} from '../organizations/organizationsSlice';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerListResponse, DeleteCustomerResponse } from '../../api/customersTypes';

export interface CustomersState {
  items: Customer[];
  selected?: Customer;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: CustomersState = {
  items: [],
  status: 'idle',
};

export const createCustomer = createAsyncThunk('customers/create', async (payload: CreateCustomerDto) => {
  return await customersApi.create(payload);
});

// Without strictNullChecks, an optional payloadCreator arg is inferred as a
// required thunk argument, so type ThunkArg explicitly as void to allow dispatch(fetchCustomers()).
export const fetchCustomers = createAsyncThunk<CustomerListResponse, void>('customers/fetchAll', async () => {
  return await customersApi.list();
});

export const fetchCustomerById = createAsyncThunk('customers/fetchById', async (id: string) => {
  return await customersApi.get(id);
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, payload }: { id: string; payload: UpdateCustomerDto }) => {
  return await customersApi.update(id, payload);
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id: string) => {
  return await customersApi.remove(id);
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Tenant switch: drop the previous organization's customers.
    builder.addCase(selectOrganization, resetOnOrganizationChange);
    builder.addCase(clearOrganizations, resetOnOrganizationChange);
    // Create
    builder.addCase(createCustomer.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.items.push(action.payload as Customer);
    });
    builder.addCase(createCustomer.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // List
    builder.addCase(fetchCustomers.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      const data = action.payload as CustomerListResponse;
      state.status = 'succeeded';
      state.error = undefined;
      state.items = data.data;
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Get by ID
    builder.addCase(fetchCustomerById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchCustomerById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const cust = action.payload as Customer;
      const existing = state.items.find((c) => c.id === cust.id);
      if (existing) {
        Object.assign(existing, cust);
      } else {
        state.items.push(cust);
      }
    });
    builder.addCase(fetchCustomerById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Update
    builder.addCase(updateCustomer.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const cust = action.payload as Customer;
      const idx = state.items.findIndex((c) => c.id === cust.id);
      if (idx >= 0) state.items[idx] = cust;
    });
    builder.addCase(updateCustomer.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // Delete
    builder.addCase(deleteCustomer.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const id = action.meta.arg as string;
      state.items = state.items.filter((c) => c.id !== id);
    });
    builder.addCase(deleteCustomer.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default customersSlice.reducer;
