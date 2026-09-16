import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { vendorsApi } from '../../api/vendorsApi';
import {
  resetOnOrganizationChange,
  selectOrganization,
  clearOrganizations,
} from '../organizations/organizationsSlice';
import type {
  Vendor,
  CreateVendorDto,
  UpdateVendorDto,
  VendorListResponse,
  DeleteVendorResponse,
} from '../../api/vendorsTypes';

export interface VendorsState {
  items: Vendor[];
  selected?: Vendor;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: VendorsState = {
  items: [],
  status: 'idle',
};

export const createVendor = createAsyncThunk('vendors/create', async (payload: CreateVendorDto) => {
  return await vendorsApi.create(payload);
});

// ThunkArg typed as void so dispatch(fetchVendors()) works without strictNullChecks.
export const fetchVendors = createAsyncThunk<VendorListResponse, void>('vendors/fetchAll', async () => {
  return await vendorsApi.list();
});

export const fetchVendorById = createAsyncThunk('vendors/fetchById', async (id: string) => {
  return await vendorsApi.get(id);
});

export const updateVendor = createAsyncThunk('vendors/update', async ({ id, payload }: { id: string; payload: UpdateVendorDto }) => {
  return await vendorsApi.update(id, payload);
});

export const deleteVendor = createAsyncThunk('vendors/delete', async (id: string) => {
  return await vendorsApi.remove(id);
});

const vendorsSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Tenant switch: drop the previous organization's vendors.
    builder.addCase(selectOrganization, resetOnOrganizationChange);
    builder.addCase(clearOrganizations, resetOnOrganizationChange);
    // CREATE
    builder.addCase(createVendor.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(createVendor.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.items.push(action.payload as Vendor);
    });
    builder.addCase(createVendor.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // LIST
    builder.addCase(fetchVendors.pending, (state) => {
      state.status = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchVendors.fulfilled, (state, action) => {
      const data = action.payload as VendorListResponse;
      state.status = 'succeeded';
      state.error = undefined;
      state.items = data.data;
    });
    builder.addCase(fetchVendors.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // GET BY ID
    builder.addCase(fetchVendorById.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchVendorById.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const vendor = action.payload as Vendor;
      const existing = state.items.find((v) => v.id === vendor.id);
      if (existing) Object.assign(existing, vendor);
      else state.items.push(vendor);
    });
    builder.addCase(fetchVendorById.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // UPDATE
    builder.addCase(updateVendor.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(updateVendor.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const vendor = action.payload as Vendor;
      const idx = state.items.findIndex((v) => v.id === vendor.id);
      if (idx >= 0) state.items[idx] = vendor;
    });
    builder.addCase(updateVendor.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
    // DELETE
    builder.addCase(deleteVendor.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(deleteVendor.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const id = action.meta.arg as string;
      state.items = state.items.filter((v) => v.id !== id);
    });
    builder.addCase(deleteVendor.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });
  },
});

export default vendorsSlice.reducer;
