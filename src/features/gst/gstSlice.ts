import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { gstApi } from '../../api/gstApi';
import type {
  GstRegisterResponse,
  GstSummaryResponse,
  GstPeriodParams,
} from '../../api/gstTypes';

export interface GstState {
  outward?: GstRegisterResponse;
  inward?: GstRegisterResponse;
  summary?: GstSummaryResponse;
  outwardStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  inwardStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  summaryStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: GstState = {
  outwardStatus: 'idle',
  inwardStatus: 'idle',
  summaryStatus: 'idle',
};

export const fetchGstOutwardSupply = createAsyncThunk(
  'gst/fetchOutwardSupply',
  async ({ organizationId, params }: { organizationId: string; params: GstPeriodParams }) => {
    return await gstApi.outwardSupply(organizationId, params);
  },
);

export const fetchGstInwardSupply = createAsyncThunk(
  'gst/fetchInwardSupply',
  async ({ organizationId, params }: { organizationId: string; params: GstPeriodParams }) => {
    return await gstApi.inwardSupply(organizationId, params);
  },
);

export const fetchGstSummary = createAsyncThunk(
  'gst/fetchSummary',
  async ({ organizationId, params }: { organizationId: string; params: GstPeriodParams }) => {
    return await gstApi.summary(organizationId, params);
  },
);

const gstSlice = createSlice({
  name: 'gst',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Outward supply register (GSTR-1 data)
    builder.addCase(fetchGstOutwardSupply.pending, (state) => {
      state.outwardStatus = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchGstOutwardSupply.fulfilled, (state, action) => {
      state.outwardStatus = 'succeeded';
      state.outward = action.payload;
    });
    builder.addCase(fetchGstOutwardSupply.rejected, (state, action) => {
      state.outwardStatus = 'failed';
      state.error = action.error.message;
    });
    // Inward supply register (GSTR-2B / ITC data)
    builder.addCase(fetchGstInwardSupply.pending, (state) => {
      state.inwardStatus = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchGstInwardSupply.fulfilled, (state, action) => {
      state.inwardStatus = 'succeeded';
      state.inward = action.payload;
    });
    builder.addCase(fetchGstInwardSupply.rejected, (state, action) => {
      state.inwardStatus = 'failed';
      state.error = action.error.message;
    });
    // Combined summary (liability vs ITC vs net)
    builder.addCase(fetchGstSummary.pending, (state) => {
      state.summaryStatus = 'loading';
      state.error = undefined;
    });
    builder.addCase(fetchGstSummary.fulfilled, (state, action) => {
      state.summaryStatus = 'succeeded';
      state.summary = action.payload;
    });
    builder.addCase(fetchGstSummary.rejected, (state, action) => {
      state.summaryStatus = 'failed';
      state.error = action.error.message;
    });
  },
});

export default gstSlice.reducer;
