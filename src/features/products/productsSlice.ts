import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { productsApi } from '../../api/productsApi';
import {
  resetOnOrganizationChange,
  selectOrganization,
  clearOrganizations,
} from '../organizations/organizationsSlice';
import type { Product, ProductListResponse, CreateProductDto, UpdateProductDto } from '../../api/productsTypes';

export interface ProductsState {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error?: string;
}

const initialState: ProductsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
};

export const createProduct = createAsyncThunk('products/create', async (payload: CreateProductDto) => {
  return await productsApi.create(payload);
});

// ThunkArg typed as void so dispatch(fetchProducts()) works without strictNullChecks.
export const fetchProducts = createAsyncThunk<ProductListResponse, void>(
  'products/fetchAll',
  async () => {
    return await productsApi.list();
  },
);

export const fetchProductById = createAsyncThunk('products/fetchById', async (id: string) => {
  return await productsApi.get(id);
});

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, payload }: { id: string; payload: UpdateProductDto }) => {
    return await productsApi.update(id, payload);
  },
);

export const deleteProduct = createAsyncThunk('products/delete', async (id: string) => {
  return await productsApi.delete(id);
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Tenant switch: drop the previous organization's products.
    builder.addCase(selectOrganization, resetOnOrganizationChange);
    builder.addCase(clearOrganizations, resetOnOrganizationChange);
    // Create
    builder.addCase(createProduct.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    // List
    builder.addCase(fetchProducts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      const data = action.payload as ProductListResponse;
      state.loading = false;
      state.items = data.data;
      state.total = data.total;
      state.page = data.page;
      state.limit = data.limit;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    // Get by ID
    builder.addCase(fetchProductById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProductById.fulfilled, (state, action) => {
      state.loading = false;
      const existing = state.items.find((p) => p.id === action.payload.id);
      if (existing) {
        Object.assign(existing, action.payload);
      } else {
        state.items.push(action.payload);
      }
    });
    builder.addCase(fetchProductById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    // Update
    builder.addCase(updateProduct.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
    });
    builder.addCase(updateProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    // Delete
    builder.addCase(deleteProduct.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.loading = false;
      const id = action.meta.arg as string;
      state.items = state.items.filter((p) => p.id !== id);
    });
    builder.addCase(deleteProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export default productsSlice.reducer;
