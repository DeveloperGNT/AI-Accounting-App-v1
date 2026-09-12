import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ApiError } from '../../api/types';
import { categoriesApi } from '../../api/categoriesApi';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  ListCategoriesResponse,
} from '../../api/categoriesTypes';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CategoriesState {
  list: Category[];
  detail?: Category;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  listStatus: RequestStatus;
  getStatus: RequestStatus;
  createStatus: RequestStatus;
  updateStatus: RequestStatus;
  deleteStatus: RequestStatus;
  error: ApiError | null;
}

const initialState: CategoriesState = {
  list: [],
  pagination: { page: 1, limit: 10, total: 0 },
  listStatus: 'idle',
  getStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
};

// Thunks
export const fetchCategories = createAsyncThunk<
  ListCategoriesResponse,
  { page?: number; limit?: number; search?: string } | void,
  { rejectValue: ApiError }
>('categories/fetchCategories', async (params, { rejectWithValue }) => {
  try {
    return await categoriesApi.list(params as any);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const fetchCategory = createAsyncThunk<
  Category,
  string,
  { rejectValue: ApiError }
>('categories/fetchCategory', async (id, { rejectWithValue }) => {
  try {
    return await categoriesApi.get(id);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const createCategory = createAsyncThunk<
  Category,
  CreateCategoryDto,
  { rejectValue: ApiError }
>('categories/createCategory', async (payload, { rejectWithValue }) => {
  try {
    return await categoriesApi.create(payload);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const updateCategory = createAsyncThunk<
  Category,
  { id: string; payload: UpdateCategoryDto },
  { rejectValue: ApiError }
>('categories/updateCategory', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await categoriesApi.update(id, payload);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const deleteCategory = createAsyncThunk<
  { success: boolean },
  string,
  { rejectValue: ApiError }
>('categories/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    return await categoriesApi.delete(id);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories(state) {
      state.list = [];
      state.detail = undefined;
      state.pagination = { page: 1, limit: 10, total: 0 };
      state.error = null;
      state.listStatus = 'idle';
      state.getStatus = 'idle';
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
      state.deleteStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    // List
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload || { code: 'FETCH_CATEGORIES_FAILED', message: action.error.message || 'Failed to fetch categories' };
      })
      // Get one
      .addCase(fetchCategory.pending, (state) => {
        state.getStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.getStatus = 'succeeded';
        state.detail = action.payload;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        state.getStatus = 'failed';
        state.error = action.payload || { code: 'GET_CATEGORY_FAILED', message: action.error.message || 'Failed to get category' };
      })
      // Create
      .addCase(createCategory.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.list.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload || { code: 'CREATE_CATEGORY_FAILED', message: action.error.message || 'Failed to create category' };
      })
      // Update
      .addCase(updateCategory.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.detail?.id === action.payload.id) state.detail = action.payload;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload || { code: 'UPDATE_CATEGORY_FAILED', message: action.error.message || 'Failed to update category' };
      })
      // Delete
      .addCase(deleteCategory.pending, (state) => {
        state.deleteStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        const id = action.meta.arg as string;
        state.list = state.list.filter((c) => c.id !== id);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload || { code: 'DELETE_CATEGORY_FAILED', message: action.error.message || 'Failed to delete category' };
      });
  },
});

export const { clearCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;
