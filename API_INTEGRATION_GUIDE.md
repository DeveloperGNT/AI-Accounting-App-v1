# API Integration Guide

This document is the permanent frontend guide for connecting the AICounts React application to the NestJS REST API.

The frontend uses:

```text
React component
  -> Redux Toolkit dispatch()
  -> createAsyncThunk
  -> API service
  -> Axios
  -> NestJS REST API
  -> response
  -> thunk result
  -> Redux slice
  -> useAppSelector()
  -> component UI
```

All future frontend API work should follow this flow.

---

# 1. Purpose of This Guide

This guide explains how to add backend API integrations to this specific AICounts frontend.

It exists so that future modules use one consistent architecture instead of placing HTTP calls, authentication headers, response mapping, and loading state directly inside UI components.

The application is gradually moving from mock/localStorage business data to real backend data. New integrations should be added independently and incrementally. Do not migrate every module in one large change.

The standard flow is:

```text
Component
  -> dispatch(thunk())
  -> createAsyncThunk
  -> API service
  -> centralized Axios client
  -> NestJS API
  -> thunk fulfilled/rejected
  -> Redux slice
  -> selector
  -> Component
```

---

# 2. ABSOLUTE BACKEND RULE

## FRONTEND ONLY

The NestJS backend is READ-ONLY during frontend API integration work.

Never:

- Modify backend files.
- Create backend files.
- Delete, rename, move, refactor, or format backend files.
- Change NestJS controllers.
- Change NestJS services.
- Change backend DTOs.
- Change backend entities.
- Change backend guards.
- Change backend modules.
- Change database code.
- Change migrations.
- Change backend authentication.
- Change Swagger configuration.
- Change backend routes.
- Change backend CORS or environment configuration.

If a backend problem or contract mismatch is discovered, report it. Do not fix it from a frontend task.

All implementation work described in this guide is frontend-only:

- Frontend API services
- Frontend TypeScript types
- Redux thunks
- Redux slices
- Frontend adapters and mappers
- React component integration
- Frontend tests and validation

Swagger and backend source may be inspected READ-ONLY to understand the contract.

---

# 3. Existing Frontend Architecture

The frontend is a React + Vite application in:

```text
Frontend-AICounts/AI-Accounting-App-v1/
```

## Main technologies

- React
- Vite
- TypeScript
- Axios
- Redux Toolkit
- react-redux
- Supabase Auth
- Tailwind CSS
- Existing component-level local state

The package scripts are:

```json
{
  "dev": "vite --host 0.0.0.0 --port 4321",
  "build": "vite build",
  "preview": "vite preview --host 0.0.0.0 --port 4321",
  "lint": "tsc --noEmit"
}
```

## Application entry

[main.tsx](src/main.tsx) mounts the application and provides the Redux store:

```tsx
<Provider store={store}>
  <AuthSessionBootstrap />
  <App />
</Provider>
```

[App.tsx](src/App.tsx) contains the current manual route/navigation logic. The project does not use React Router.

## Redux store

[store.ts](src/app/store.ts) currently registers:

- `auth`
- `users`

```ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
  },
});
```

Every new slice must be registered in this store before components can select its state.

## Typed Redux hooks

[hooks.ts](src/app/hooks.ts) provides:

```ts
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

Use these hooks in components instead of untyped `useDispatch()` and `useSelector()`.

## Current API services

The existing services are in `src/api/`:

- [authApi.ts](src/api/authApi.ts)
- `usersApi.ts`
- `healthApi.ts`
- `response.ts`
- `types.ts`

The services contain API calls and authentication-provider calls. They do not render UI.

## Centralized Axios client

[axiosInstance.ts](src/lib/axiosInstance.ts) exports `apiClient`.

It currently:

- Uses `VITE_API_BASE_URL` through [env.ts](src/config/env.ts).
- Reads the active Supabase session before requests.
- Adds `Authorization: Bearer <access-token>` when a session exists.
- Normalizes Axios errors through `toApiError()`.

## Supabase client

[supabaseClient.ts](src/lib/supabaseClient.ts) creates the single Supabase client from:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Supabase is the authentication/session source of truth.

## Existing authentication state

[authSlice.ts](src/features/auth/authSlice.ts) contains the authentication thunks and Redux state.

There is no separate `authThunks.ts` file currently. Authentication thunks are colocated with the auth slice.

Existing auth operations include:

- `login`
- `signup`
- `logout`
- `restoreSession`
- `resetPassword`
- `updatePassword`
- `fetchCurrentUser`
- `verifyRls`

## Existing user profile state

[usersSlice.ts](src/features/users/usersSlice.ts) contains:

- `fetchCurrentUserProfile`
- `updateCurrentUserProfile`
- `currentProfile`
- loading status
- API error state

## Existing session bootstrap

[AuthSessionBootstrap.tsx](src/app/AuthSessionBootstrap.tsx) coordinates:

- Initial Supabase session restoration
- Supabase auth state changes
- Backend `/auth/me` loading
- Backend `/users/me` loading
- Clearing Redux state on explicit sign-out

It also prevents duplicate restore initialization and protects against stale restore results overwriting a successful login.

## Existing business state

[AccountingContext.tsx](src/context/AccountingContext.tsx) still contains mock/localStorage business-domain data such as invoices, customers, vendors, expenses, notifications, and transactions.

Do not add new API business state to this Context. New API-backed domain state should use Redux slices and services.

---

# 4. API Integration Architecture

Each layer has one responsibility.

## API service

The API service:

- Knows endpoint URLs.
- Knows HTTP methods.
- Sends requests through `apiClient`.
- Defines request and response types.
- Unwraps or normalizes response envelopes where needed.
- Contains no React code.
- Contains no Redux state logic.

Example:

```ts
export const customersApi = {
  async list(params: CustomerListParams) {
    const response = await apiClient.get('/customers', { params });
    return unwrapApiResponse<CustomerListResponse>(response.data);
  },
};
```

## Thunk

The thunk:

- Connects Redux to the API service.
- Performs asynchronous work.
- Receives arguments from `dispatch()`.
- Returns a typed success value.
- Uses `rejectWithValue()` for predictable errors.
- Produces pending, fulfilled, and rejected lifecycle actions.

## Slice

The slice:

- Stores API data.
- Stores selected records.
- Stores loading status.
- Stores errors.
- Updates state for thunk lifecycle actions.
- Contains local state reducers when useful.

The slice should not contain raw Axios calls.

## Component

The component:

- Creates local form/display state when needed.
- Dispatches thunks.
- Reads Redux state using selectors.
- Displays loading, error, success, and data states.
- Must not call Axios directly.
- Must not construct bearer headers.
- Must not read Supabase access tokens.

---

# 5. How to Create an API Service

A feature service should be grouped with the feature or in `src/api/`, following the existing project convention.

A future module may use this structure:

```text
src/
  api/
    customersApi.ts
  features/
    customers/
      customersSlice.ts
      customersTypes.ts
```

If a module has many operations, its service can live inside the feature directory:

```text
src/
  features/
    customers/
      customersApi.ts
      customersSlice.ts
      customersThunks.ts
      customersTypes.ts
      customerMappers.ts
```

Use the existing centralized client:

```ts
import { apiClient } from '../../lib/axiosInstance';
import { unwrapApiResponse } from '../../api/response';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './customersTypes';

export const customersApi = {
  async list(): Promise<Customer[]> {
    const response = await apiClient.get('/customers');
    return unwrapApiResponse<Customer[]>(response.data);
  },

  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get(`/customers/${id}`);
    return unwrapApiResponse<Customer>(response.data);
  },

  async create(payload: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post('/customers', payload);
    return unwrapApiResponse<Customer>(response.data);
  },

  async update(id: string, payload: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiClient.patch(`/customers/${id}`, payload);
    return unwrapApiResponse<Customer>(response.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
```

## GET

Use `apiClient.get()` for reads:

```ts
const response = await apiClient.get('/customers', {
  params: { page: 1, limit: 20, search },
});
```

## POST

Use `apiClient.post(path, payload)` for creates or actions:

```ts
await apiClient.post('/customers', payload);
```

## PATCH

Use `apiClient.patch(path, payload)` for updates:

```ts
await apiClient.patch(`/customers/${id}`, payload);
```

## DELETE

Use `apiClient.delete(path)` for deletion:

```ts
await apiClient.delete(`/customers/${id}`);
```

Do not create another Axios instance for a feature.

---

# 6. How to Create TypeScript API Types

Keep three concepts separate when they differ:

1. Request/payload type: what the backend expects.
2. Backend response type: what the backend returns.
3. Frontend/UI model: what the existing component needs to render.

## Request type

```ts
export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  paymentTermsDays: number;
}
```

## Backend response type

```ts
export interface CustomerResponse {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  outstandingBalance: number;
  totalSales: number;
  createdAt: string;
}
```

## UI model

```ts
export interface CustomerViewModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  displayBalance: string;
}
```

Do not blindly reuse an existing UI type as a backend DTO. UI types often contain calculated display fields, labels, mock IDs, or fields that the backend does not accept.

The current frontend `types.ts` contains UI-oriented models. Future API modules should add API request/response types rather than forcing backend DTOs into those UI models.

---

# 7. How to Create a Redux Slice

A normal feature state contains:

- `items`: list data
- `selectedItem`: detail data when needed
- `status`: `idle`, `loading`, `succeeded`, or `failed`
- `error`: normalized API error
- pagination/filter state when needed

Example:

```ts
interface CustomersState {
  items: CustomerResponse[];
  selectedItem: CustomerResponse | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: ApiError | null;
}

const initialState: CustomersState = {
  items: [],
  selectedItem: null,
  status: 'idle',
  error: null,
};
```

Create the slice with reducers and `extraReducers`:

```ts
const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearSelectedCustomer(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || {
          code: 'CUSTOMERS_LOAD_FAILED',
          message: 'Unable to load customers.',
        };
      });
  },
});
```

## Pending

The request has started. Clear stale errors and show loading UI.

## Fulfilled

The backend returned successfully. Store the response and show the data.

## Rejected

The request failed. Store the normalized error and show a useful message.

Reducers should update state only. They should not call Axios or Supabase.

---

# 8. How to Create createAsyncThunk

`createAsyncThunk` is the async bridge between a component dispatch and an API service.

Example list thunk:

```ts
export const fetchCustomers = createAsyncThunk<
  CustomerResponse[],
  CustomerListParams | undefined,
  { rejectValue: ApiError }
>('customers/fetchCustomers', async (params, { rejectWithValue }) => {
  try {
    return await customersApi.list(params);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});
```

Example create thunk:

```ts
export const createCustomer = createAsyncThunk<
  CustomerResponse,
  CreateCustomerRequest,
  { rejectValue: ApiError }
>('customers/createCustomer', async (payload, { rejectWithValue }) => {
  try {
    return await customersApi.create(payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});
```

The same pattern applies to update and delete:

```ts
export const updateCustomer = createAsyncThunk<
  CustomerResponse,
  { id: string; payload: UpdateCustomerRequest },
  { rejectValue: ApiError }
>('customers/updateCustomer', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await customersApi.update(id, payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const deleteCustomer = createAsyncThunk<
  string,
  string,
  { rejectValue: ApiError }
>('customers/deleteCustomer', async (id, { rejectWithValue }) => {
  try {
    await customersApi.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});
```

## Organization/tenant arguments

Once organization state is implemented in Redux, a thunk may read the active organization ID through `getState()` or pass it into the service as an explicit argument:

```ts
export const fetchCustomers = createAsyncThunk<
  CustomerResponse[],
  void,
  { state: RootState; rejectValue: ApiError }
>('customers/fetchCustomers', async (_, { getState, rejectWithValue }) => {
  try {
    const organizationId = getState().organizations.activeOrganizationId;
    return await customersApi.list({ organizationId });
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});
```

The preferred future design is for the centralized Axios client to obtain the active organization ID and attach the tenant header, so individual components do not build headers.

---

# 9. How dispatch() Works

This call:

```ts
dispatch(fetchCustomers());
```

starts the `fetchCustomers` thunk.

This call:

```ts
dispatch(createCustomer(payload));
```

starts the create operation with the form payload.

Internally:

1. The component dispatches a thunk action.
2. Redux Toolkit dispatches the thunk's `pending` action.
3. The slice changes status to `loading`.
4. The thunk calls the API service.
5. The API service calls Axios.
6. Axios attaches the current session token.
7. NestJS processes the HTTP request.
8. The thunk receives the response or error.
9. Redux Toolkit dispatches `fulfilled` or `rejected`.
10. The slice stores the result or error.
11. The component re-renders through `useAppSelector()`.

A useful analogy is a courier:

- Component: asks for work.
- Thunk: carries the request.
- Service: knows the destination and request format.
- Axios: transports the request.
- Backend: performs the work.
- Slice: stores the delivery result.
- Selector: lets the component read it.

---

# 10. How Components Read Redux Data

Use the typed hooks from `src/app/hooks.ts`.

```tsx
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchCustomers } from '../../features/customers/customersSlice';

export function CustomersView() {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.customers);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchCustomers());
    }
  }, [dispatch, status]);

  if (status === 'loading') return <div>Loading customers...</div>;
  if (status === 'failed') return <div>{error?.message}</div>;

  return <CustomerTable customers={items} />;
}
```

Use `useAppDispatch()` for actions and `useAppSelector()` for state.

Dispatch a fetch thunk:

- When a page first loads.
- When the active organization changes.
- When a search or filter changes, if the API supports server-side filtering.
- After a mutation when fresh server data is required.

Do not use `useEffect` to call Axios directly.

---

# 11. Complete CRUD Example

The following is the recommended pattern for a future Customers module.

## Types

```ts
export interface CustomerResponse {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  outstandingBalance: number;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  paymentTermsDays: number;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

## API service

```ts
export const customersApi = {
  async list(): Promise<CustomerResponse[]> {
    const response = await apiClient.get('/customers');
    return unwrapApiResponse<CustomerResponse[]>(response.data);
  },

  async getById(id: string): Promise<CustomerResponse> {
    const response = await apiClient.get(`/customers/${id}`);
    return unwrapApiResponse<CustomerResponse>(response.data);
  },

  async create(payload: CreateCustomerRequest): Promise<CustomerResponse> {
    const response = await apiClient.post('/customers', payload);
    return unwrapApiResponse<CustomerResponse>(response.data);
  },

  async update(id: string, payload: UpdateCustomerRequest): Promise<CustomerResponse> {
    const response = await apiClient.patch(`/customers/${id}`, payload);
    return unwrapApiResponse<CustomerResponse>(response.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
```

## Thunks

```ts
export const fetchCustomers = createAsyncThunk<
  CustomerResponse[],
  void,
  { rejectValue: ApiError }
>('customers/fetchCustomers', async (_, { rejectWithValue }) => {
  try {
    return await customersApi.list();
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const fetchCustomerById = createAsyncThunk<
  CustomerResponse,
  string,
  { rejectValue: ApiError }
>('customers/fetchCustomerById', async (id, { rejectWithValue }) => {
  try {
    return await customersApi.getById(id);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const createCustomer = createAsyncThunk<
  CustomerResponse,
  CreateCustomerRequest,
  { rejectValue: ApiError }
>('customers/createCustomer', async (payload, { rejectWithValue }) => {
  try {
    return await customersApi.create(payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const updateCustomer = createAsyncThunk<
  CustomerResponse,
  { id: string; payload: UpdateCustomerRequest },
  { rejectValue: ApiError }
>('customers/updateCustomer', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await customersApi.update(id, payload);
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});

export const deleteCustomer = createAsyncThunk<
  string,
  string,
  { rejectValue: ApiError }
>('customers/deleteCustomer', async (id, { rejectWithValue }) => {
  try {
    await customersApi.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(error as ApiError);
  }
});
```

## Slice lifecycle

```ts
extraReducers: (builder) => {
  builder
    .addCase(fetchCustomers.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    })
    .addCase(fetchCustomers.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.items = action.payload;
    })
    .addCase(fetchCustomers.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload || null;
    })
    .addCase(fetchCustomerById.fulfilled, (state, action) => {
      state.selectedItem = action.payload;
    })
    .addCase(createCustomer.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    })
    .addCase(updateCustomer.fulfilled, (state, action) => {
      state.items = state.items.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      );
    })
    .addCase(deleteCustomer.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
}
```

## Component usage

```tsx
const dispatch = useAppDispatch();
const { items, status, error } = useAppSelector((state) => state.customers);

const handleCreate = async (payload: CreateCustomerRequest) => {
  await dispatch(createCustomer(payload)).unwrap();
};

const handleDelete = (id: string) => {
  void dispatch(deleteCustomer(id));
};
```

The component owns form fields. The service owns HTTP. The thunk owns async coordination. The slice owns server state.

---

# 12. Axios Architecture

The centralized client is:

```text
src/lib/axiosInstance.ts
```

It is created once:

```ts
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Base URL

The base URL comes from:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Do not hard-code the backend URL in individual services or components.

## Supabase access token

The request interceptor calls:

```ts
const { data } = await supabase.auth.getSession();
const accessToken = data.session?.access_token;
```

When a token exists, it adds:

```http
Authorization: Bearer <access-token>
```

Components and thunks must never manually construct this header.

## Tenant header

The backend tenant guard expects:

```http
x-organization-id: <organization UUID>
```

The current Axios client attaches the bearer token, but active-organization Redux state and automatic `x-organization-id` attachment are not yet implemented. When organization integration is added, tenant header handling should be centralized in the Axios client rather than repeated in services or components.

## Response normalization

[response.ts](src/api/response.ts) contains `unwrapApiResponse()` to support the response envelopes currently observed:

```ts
{
  success: true,
  data: value
}
```

The normalizer can unwrap nested supported envelopes without spreading envelope logic through components.

## Error normalization

[apiError.ts](src/lib/apiError.ts) converts Axios and provider errors into a predictable frontend error shape.

The error includes fields such as:

- `code`
- `message`
- `statusCode`
- `providerCode`
- `providerStatus`
- `providerErrorId`
- `requestId` when provided by the backend

## 401 handling

A `401` means the request is not authenticated or the token is invalid/expired.

The frontend should:

- Let Supabase manage token refresh.
- Clear Redux auth only when the session is actually signed out or invalid.
- Return the user to the login flow when no valid Supabase session remains.
- Avoid logging out on unrelated errors.

## 403 handling

A `403` means the session may be valid but the user is not authorized for the requested action or tenant.

Keep the session. Show an access-denied message. Do not automatically log the user out.

---

# 13. Supabase Authentication

The authentication flow is:

```text
Supabase Auth
  -> active Supabase session
  -> access token
  -> Axios request interceptor
  -> Authorization: Bearer token
  -> NestJS backend
```

Supabase is the source of truth for:

- Login
- Signup
- Logout
- Password reset
- Session restoration
- Token refresh

The current auth service uses:

```ts
supabase.auth.signInWithPassword(...)
supabase.auth.signUp(...)
supabase.auth.signOut()
supabase.auth.getSession()
supabase.auth.onAuthStateChange(...)
supabase.auth.resetPasswordForEmail(...)
supabase.auth.updateUser({ password })
```

Do not:

- Create custom JWTs.
- Store access tokens in custom localStorage keys.
- Store passwords.
- Send passwords to the NestJS backend.
- Put a Supabase service-role key in the frontend.

Only the public Supabase URL and anon/publishable key belong in frontend environment configuration.

---

# 14. Multi-Tenant / Organization API Calls

The intended future organization flow is:

```text
Redux activeOrganizationId
  -> centralized Axios client
  -> x-organization-id header
  -> NestJS tenant guard
  -> organization-scoped response
```

The backend expects a real organization UUID. Do not send mock IDs such as:

```text
org_acme
```

Mock IDs are useful only for the current mock UI and are not valid tenant identifiers for the backend.

## Organization switching

When a user switches organizations:

1. Store the selected real organization UUID in Redux.
2. Make the Axios client use that organization ID for future requests.
3. Clear or mark tenant-scoped Redux data stale.
4. Refetch tenant-scoped data.
5. Ensure the UI does not display records from the previous organization.

The backend remains the authorization authority. A frontend-selected organization ID is not proof of membership.

The current `AccountingContext` still contains local organization/mock state. Organization API integration is not yet implemented.

---

# 15. API Response Handling

The backend commonly returns a success envelope:

```json
{
  "success": true,
  "data": {
    "id": "..."
  }
}
```

The backend error envelope observed by the frontend is:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "statusCode": 400,
    "path": "/api/v1/example",
    "timestamp": "2026-09-11T00:00:00.000Z",
    "requestId": "..."
  }
}
```

The frontend uses `unwrapApiResponse()` and `toApiError()` for these shapes.

Response-envelope inconsistencies may exist because the backend has both a global response interceptor and controllers that may manually return `{ success, data }`. Do not modify the backend from a frontend integration task. Normalize supported response shapes in the frontend service layer and report contract inconsistencies separately.

A service should return the useful typed data to its thunk, not force components to know the transport envelope.

---

# 16. API Contract / Swagger

Swagger is the backend API contract reference.

Use the live documentation at:

```text
http://localhost:3001/api/docs
```

Use Swagger to identify:

- HTTP method
- URL path
- Path parameters
- Query parameters
- Request body
- Required fields
- Authentication requirements
- Response structure
- Error possibilities

A backend contract is simply the agreement between the frontend and backend about how a request and response must look.

Example:

If Swagger says:

```http
POST /api/v1/customers
```

expects:

```json
{
  "name": "Example Customer",
  "email": "customer@example.com"
}
```

then the frontend must send that shape through the service:

```ts
apiClient.post('/customers', {
  name,
  email,
});
```

Do not guess field names from the UI. Inspect Swagger and backend DTOs READ-ONLY.

---

# 17. Data Mapping / Adapters

The UI model and backend DTO may represent the same business concept differently.

Use mapping functions instead of changing the backend contract or spreading conversion logic across components.

Examples:

```text
Frontend display field: customerName
Backend relationship field: customerId
```

```text
Frontend form field: rate
Backend DTO field: unitPrice
```

```text
Frontend form field: date
Backend DTO field: invoiceDate
```

Example mapper:

```ts
export const toCreateInvoiceRequest = (
  form: InvoiceFormModel,
): CreateInvoiceRequest => ({
  customerId: form.customerId,
  invoiceDate: form.date,
  dueDate: form.dueDate || undefined,
  items: form.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.rate,
    discount: item.discountPct,
    taxRate: item.gstRate,
  })),
});
```

The mapper is the boundary between presentation data and backend data.

---

# 18. API Integration Checklist

Use this checklist for every new module:

- [ ] Inspect Swagger/backend contract READ-ONLY.
- [ ] Inspect existing frontend types.
- [ ] Define API request types.
- [ ] Define API response types.
- [ ] Define UI models if they differ.
- [ ] Create the API service.
- [ ] Use the centralized Axios client.
- [ ] Create `createAsyncThunk` operations.
- [ ] Use `rejectWithValue` for meaningful errors.
- [ ] Create the Redux slice.
- [ ] Register the reducer in `src/app/store.ts`.
- [ ] Add typed selectors/hooks if needed.
- [ ] Add request/response mappers.
- [ ] Dispatch the thunk from the component.
- [ ] Read data using `useAppSelector()`.
- [ ] Add loading UI.
- [ ] Add error UI.
- [ ] Add success UI where appropriate.
- [ ] Test success responses.
- [ ] Test failure responses.
- [ ] Test authentication.
- [ ] Test the tenant header when applicable.
- [ ] Test organization switching when applicable.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Confirm no backend files were modified.

---

# 19. Common Mistakes to Avoid

Avoid these patterns:

## Axios directly inside components

Bad:

```tsx
await axios.get('/customers');
```

Use a service and thunk instead.

## Manually adding Authorization headers

Bad:

```ts
headers: { Authorization: `Bearer ${token}` }
```

The centralized Axios interceptor owns this behavior.

## Manually storing access tokens

Never create custom keys such as:

```ts
localStorage.setItem('token', token);
localStorage.setItem('access_token', token);
localStorage.setItem('jwt', token);
```

Supabase manages session persistence and token refresh.

## Putting API logic inside slices

Slices respond to thunk lifecycle actions. They should not contain raw Axios calls.

## Putting API calls inside reducers

Reducers must remain synchronous and side-effect free.

## Using mock IDs for real API calls

IDs such as `org_acme` or `cust_001` are not valid backend UUIDs.

## Sending UI-only fields

Do not send calculated labels, display-only fields, or fields not present in the backend DTO.

## Trusting frontend-calculated totals

If the backend calculates invoice, tax, expense, or accounting totals, treat the backend response as authoritative.

## Forgetting loading/error states

Every async operation needs visible pending and failure handling.

## Forgetting tenant headers

Tenant-scoped APIs need the real organization UUID through the centralized tenant mechanism.

## Modifying the backend to make the frontend work

Report contract problems. Do not alter NestJS code during frontend work.

## Mixing mock and real data without a migration strategy

A page must have a clear source of truth. Do not silently merge local mock records with server records.

---

# 20. Migration Strategy

The frontend should migrate gradually:

```text
Foundation
  -> Auth
  -> Organizations
  -> Reference CRUD module
  -> Dependent modules
  -> Remove mock state gradually
```

Recommended approach:

1. Build shared Axios, environment, Supabase, Redux, and error foundations.
2. Complete authentication and session restoration.
3. Integrate organizations and active tenant context.
4. Choose one small reference CRUD module.
5. Add its types, service, thunks, slice, and component integration.
6. Validate the pattern with TypeScript, build, and API tests.
7. Migrate modules that depend on that reference data.
8. Remove only the corresponding mock/localStorage state after server state is stable.
9. Continue module by module.
10. Remove the remaining domain mock state only when each replacement is verified.

Do not migrate invoices, customers, vendors, expenses, accounting, GST, or other modules all at once.

---

# 21. Current Integration Status

## Implemented

The following frontend foundation exists today:

- React + Vite application.
- Centralized Axios client in `src/lib/axiosInstance.ts`.
- Environment configuration in `src/config/env.ts`.
- Supabase client in `src/lib/supabaseClient.ts`.
- Supabase access-token retrieval through the Axios request interceptor.
- API error normalization in `src/lib/apiError.ts`.
- API response unwrapping in `src/api/response.ts`.
- Redux Toolkit store in `src/app/store.ts`.
- Typed Redux hooks in `src/app/hooks.ts`.
- Auth Redux slice in `src/features/auth/authSlice.ts`.
- Users Redux slice in `src/features/users/usersSlice.ts`.
- Auth API service in `src/api/authApi.ts`.
- Users API service in `src/api/usersApi.ts`.
- Health API service in `src/api/healthApi.ts`.
- Supabase login, signup, logout, session restore, password reset, and password update thunks.
- `/auth/me` integration.
- `/auth/verify-rls` service/thunk support.
- `/users/me` read/update service/thunk support.
- Session bootstrap in `src/app/AuthSessionBootstrap.tsx`.
- Login, signup, logout, forgot-password, and reset-password UI integration.
- Initialization race protection for session restoration.

## Not yet integrated

The following business modules are not yet connected to real Redux/API state:

- Organizations
- Memberships
- Customers
- Vendors
- Products
- Categories
- Accounts
- Journal entries
- Invoices
- Purchase bills
- Payments
- Vendor payments
- Expenses
- GST reports
- Files
- AI
- Notifications
- General reports
- Banking
- Review queue
- Platform administration

The existing business pages still use `AccountingContext`, mock data, and localStorage for much of their data.

The `x-organization-id` Axios behavior is also not yet implemented because the organization Redux context has not yet been integrated.

---

# 22. Future Module Pattern

Every future module should follow:

```text
Component
  -> dispatch(thunk)
  -> createAsyncThunk
  -> API service
  -> centralized Axios
  -> NestJS backend
  -> thunk result
  -> Redux slice
  -> useAppSelector()
  -> component
```

Small example:

```tsx
const dispatch = useAppDispatch();
const customers = useAppSelector((state) => state.customers.items);

useEffect(() => {
  void dispatch(fetchCustomers());
}, [dispatch]);

const handleCreate = (payload: CreateCustomerRequest) => {
  void dispatch(createCustomer(payload));
};
```

The component does not know how Axios, Supabase tokens, response envelopes, or backend errors work.

---

# 23. Debugging API Integration

Use the browser DevTools Network tab first.

Inspect:

- Request URL
- HTTP method
- Query parameters
- Request payload
- Request headers
- `Authorization` header presence
- `x-organization-id` header when applicable
- Response status
- Response body
- CORS response headers
- Request timing

## 401 Unauthorized

Check:

- Supabase session exists.
- Supabase access token has not expired.
- Axios request interceptor is running.
- Request contains `Authorization: Bearer ...`.
- The frontend is using the correct Supabase project.

Do not manually copy the token into localStorage.

## 403 Forbidden

Check:

- User is an active member of the selected organization.
- Correct organization UUID is selected.
- The role has the required permission.
- The endpoint is being called in the correct tenant context.

A 403 should not automatically log the user out.

## 400 Validation error

Check:

- Request body field names against Swagger and DTOs.
- Required fields.
- Date format.
- Number format.
- Enum values.
- UUID fields.
- Nested item structure.

Show the normalized backend message in the UI.

## 404 Not Found

Check:

- Base URL.
- Global API prefix.
- Endpoint path.
- Duplicate or missing version prefixes.
- Resource ID.
- Whether Swagger path and runtime path match.

Report backend route inconsistencies. Do not modify backend files.

## 500 Server error

Check the response body and backend request ID. Confirm whether the error is:

- A backend application error.
- A Supabase provider error.
- A contract mismatch that reached server processing.
- An external email/storage/AI provider failure.

Do not hide the useful provider message, but do not expose tokens or secrets.

## Network/CORS error

Check:

- Frontend origin and backend CORS configuration.
- Backend availability.
- Browser Network response.
- `VITE_API_BASE_URL`.
- Whether a proxy or development port is involved.

Report backend CORS issues instead of editing backend configuration during frontend work.

## Wrong tenant ID

Check:

- The selected ID is a real backend UUID.
- The `x-organization-id` header matches the URL organization ID when both exist.
- Redux changed the active organization before the request was made.
- Tenant-scoped data was refreshed after switching organizations.

## Wrong UUID

Mock IDs such as `org_acme` and `cust_001` will fail UUID validation. Use IDs returned by the backend.

## Incorrect request payload

Compare the actual Network payload with Swagger and the backend DTO. Use an adapter rather than changing the UI model or backend.

## Incorrect response mapping

Inspect the raw response, envelope shape, date fields, status values, numeric values, and nested records. Put mapping in a service adapter or mapper file.

---

# 24. Safe Development Rules

## FRONTEND ONLY

Before every API integration task:

1. Inspect the existing frontend implementation.
2. Inspect Swagger and backend contract READ-ONLY.
3. Define frontend types and adapters.
4. Implement the frontend API service.
5. Implement `createAsyncThunk` operations.
6. Implement the Redux slice.
7. Register the reducer.
8. Connect the component with dispatch and selectors.
9. Test loading, success, failure, authentication, and tenant behavior.
10. Run TypeScript validation.
11. Run the production build.
12. Never modify backend files.
13. Report backend issues separately.

Do not use a frontend integration task as an opportunity to refactor unrelated UI or backend code.

---

# 25. Quick Reference

| Item | Responsibility |
|---|---|
| API service | Talks to the backend endpoint |
| Thunk | Async bridge between Redux and the API service |
| Slice | Stores API data, status, and errors |
| `dispatch()` | Starts a thunk operation |
| Selector | Reads Redux state |
| Axios | HTTP client used by API services |
| Supabase | Authentication and session source |
| `Authorization` | Bearer access token added centrally by Axios |
| `x-organization-id` | Tenant context for organization-scoped APIs |
| Swagger | Backend API contract |
| Mapper/adapter | Converts UI models to backend DTOs and responses to UI models |

The standard implementation remains:

```text
React
  -> Redux Toolkit
  -> createAsyncThunk
  -> API service
  -> Axios
  -> NestJS REST API
  -> response
  -> Redux slice
  -> useAppSelector()
  -> React UI
```

Only create or modify frontend files when implementing this flow. The backend remains READ-ONLY.
