# API Integration Audit — AICounts Frontend

Last verified: 2026-09-12 (TypeScript clean, `vite build` passes)

Convention: `UI → useAppDispatch() → createAsyncThunk (slice file) → src/api/*Api.ts → lib/axiosInstance (apiClient) → NestJS backend`.
`apiClient` attaches the Supabase Bearer token and the `x-organization-id` tenant header to every request.

Status legend: ✅ fully wired · 🟡 thunk exists, no natural UI trigger found · ❌ mock/local only.

### ⚠️ Response-shape contract (source of a runtime crash)

List endpoints return TWO different shapes — verified in the read-only backend services:

- **Paginated** `{ data: T[], total, page, limit }`: customers, vendors, products, categories,
  memberships → slices read `payload.data`.
- **Bare array** `T[]`: **accounts** (`accountsService.findAll` → `Account[]`) and
  **journal-entries** (`accountingService.findAll` → `JournalEntry[]`), plus invoices,
  vendor-payments and GST reports → slices read the payload directly.

A previous accounts/journal-entries slice version assigned `payload.data` (i.e. `undefined`) from a
bare-array response, crashing `.filter()` consumers (`ExpensesView` line 44 et al.). Both slices now
type the thunk payload as the array and guard with `Array.isArray(...)`, so `items` can never become
undefined. The bug only surfaced once the URL fixes above made these requests actually succeed.

### ⚠️ URL prefix reality (verified in `main.ts` + swagger.json)

The backend applies `app.setGlobalPrefix('api/v1')` in `main.ts`. Some controllers ALSO hardcode
`api/v1` in their `@Controller(...)` path (accounts, journal-entries, invoices, payments), so those
routes are really served at **`/api/v1/api/v1/...`** (exactly what Swagger displays). Everything else
(customers, vendors, categories, products, memberships, organizations, users, auth, GST reports)
uses the single global prefix. The frontend apiClient `baseURL` is `/api/v1`, therefore:

- doubled-route modules call relative paths `/api/v1/accounts`, `/api/v1/payments`, …
- single-route modules call relative paths `/customers`, `/organizations/{id}/gst/reports/…`, …
- No service ever writes the literal string `/api/v1/api/v1` — that would triple-prefix.
- The vite dev proxy passes `/api/*` through to the backend unchanged (no rewrite).

## 1. Auth (Supabase + backend session)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| Login | POST (Supabase) | auth/v1/token | authApi.login | login | auth | LoginPage | ✅ | ✅ |
| Signup | POST (Supabase) | auth/v1/signup | authApi.signup | signup | auth | SignupPage | ✅ | ✅ |
| Logout | POST (Supabase) | auth/v1/logout | authApi.logout | logout | auth | TopNav, ResetPasswordPage | ✅ | ✅ |
| Session restore | GET (Supabase) | auth/v1/user | authApi.restoreSession | restoreSession | auth | AuthSessionBootstrap | ✅ | ✅ |
| Forgot password | POST (Supabase) | auth/v1/recover | authApi.resetPassword | resetPassword | auth | ForgotPasswordPage | ✅ | ✅ |
| Update password | PUT (Supabase) | auth/v1/user | authApi.updatePassword | updatePassword | auth | ResetPasswordPage | ✅ | ✅ |
| Current auth user | GET | /auth/me | authApi.getCurrentUser | fetchCurrentUser | auth | AuthSessionBootstrap | ✅ | ✅ |
| Verify RLS tenant | GET | /auth/verify-rls | authApi.verifyRls | verifyRls | auth | — | ❌ | 🟡 |

## 2. Users (profile)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| Get profile | GET | /users/me | usersApi.getCurrentProfile | fetchCurrentUserProfile | users | AuthSessionBootstrap | ✅ | ✅ |
| Update profile | PATCH | /users/me | usersApi.updateCurrentProfile | updateCurrentUserProfile | users | — (no profile editor UI exists) | ❌ | 🟡 |

## 3. Organizations

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List orgs | GET | /organizations | organizationsApi.list | fetchOrganizations | organizations | AuthSessionBootstrap | ✅ | ✅ |
| Create org | POST | /organizations | organizationsApi.create | createOrganization | organizations | CreateOrganizationPage (via AccountingContext.createOrganization) | ✅ | ✅ |
| Get current org | GET | /organizations/current | organizationsApi.getCurrent | fetchCurrentOrganization | organizations | SettingsView (profile tab) | ✅ | ✅ |
| Update current org | PATCH | /organizations/current | organizationsApi.updateCurrent | updateCurrentOrganization | organizations | SettingsView → AccountingContext.updateOrganization | ✅ | ✅ |
| Switch tenant | — (Redux) | — (header updated) | lib/tenantContext | selectOrganization (reducer) | organizations | TopNav org switcher → AccountingContext.switchOrganization | ✅ | ✅ |

## 4. Memberships (team & RBAC)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List members | GET | /memberships | membershipsApi.list | fetchMemberships | memberships | SettingsView (Team tab) | ✅ | ✅ |
| Invite member | POST | /memberships/invitations | membershipsApi.createInvitation | createInvitation | memberships | SettingsView invite modal | ✅ | ✅ |
| Preview invitation | POST | /memberships/invitations/preview | membershipsApi.previewInvitation | previewInvitation | memberships | — (no accept-invitation page exists; token comes by email) | ❌ | 🟡 |
| Accept invitation | POST | /memberships/invitations/accept | membershipsApi.acceptInvitation | acceptInvitation | memberships | — (same as above) | ❌ | 🟡 |
| Update role | PATCH | /memberships/{id}/role | membershipsApi.updateRole | updateMemberRole | memberships | SettingsView role `<select>` | ✅ | ✅ |
| Transfer ownership | POST | /memberships/{id}/transfer-ownership | membershipsApi.transferOwnership | transferMembershipOwnership | memberships | SettingsView "Make Owner" | ✅ | ✅ |
| Remove member | DELETE | /memberships/{id} | membershipsApi.delete | deleteMembership | memberships | SettingsView "Remove" | ✅ | ✅ |

## 5. Customers (full CRUD)

> **Backend validation contract (learned from a 400 bug):** `CreateCustomerDto` and `CreateVendorDto`
> require `email`, `phone`, `address`, `city`, `state` as **non-empty** strings (`@IsNotEmpty()`, not optional).
> The forms therefore mark these fields required, validate before dispatch, strip blank optional fields
> (gstin, pan, tradeName, bank fields) from the payload, and surface the backend's real validation
> message via `utils/apiErrorMessage.ts` (Redux rejects with a plain ApiError object, not an `Error`).

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /customers | customersApi.list | fetchCustomers | customers | CustomersView (mount + retry) | ✅ | ✅ |
| Get by id | GET | /customers/{id} | customersApi.get | fetchCustomerById | customers | CustomersView (detail modal) | ✅ | ✅ |
| Create | POST | /customers | customersApi.create | createCustomer | customers | CustomersView add modal | ✅ | ✅ |
| Update | PATCH | /customers/{id} | customersApi.update | updateCustomer | customers | CustomersView edit modal (also InvoiceEditor customer prefill) | ✅ | ✅ |
| Delete | DELETE | /customers/{id} | customersApi.remove | deleteCustomer | customers | CustomersView row delete | ✅ | ✅ |

## 6. Vendors (full CRUD)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /vendors | vendorsApi.list | fetchVendors | vendors | VendorsView (mount + retry) | ✅ | ✅ |
| Get by id | GET | /vendors/{id} | vendorsApi.get | fetchVendorById | vendors | VendorsView (detail modal) | ✅ | ✅ |
| Create | POST | /vendors | vendorsApi.create | createVendor | vendors | VendorsView add modal | ✅ | ✅ |
| Update | PATCH | /vendors/{id} | vendorsApi.update | updateVendor | vendors | VendorsView edit modal | ✅ | ✅ |
| Delete | DELETE | /vendors/{id} | vendorsApi.remove | deleteVendor | vendors | VendorsView row delete | ✅ | ✅ |

## 7. Products (full CRUD)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /products | productsApi.list | fetchProducts | products | CatalogView (mount + retry) | ✅ | ✅ |
| Get by id | GET | /products/{id} | productsApi.get | fetchProductById | products | — (list covers the UI need) | ❌ | 🟡 |
| Create | POST | /products | productsApi.create | createProduct | products | CatalogView product modal | ✅ | ✅ |
| Update | PATCH | /products/{id} | productsApi.update | updateProduct | products | CatalogView product modal | ✅ | ✅ |
| Delete | DELETE | /products/{id} | productsApi.delete | deleteProduct | products | CatalogView row delete | ✅ | ✅ |

## 8. Categories (full CRUD)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /categories | categoriesApi.list | fetchCategories | categories | CatalogView, ExpensesView (dropdowns) | ✅ | ✅ |
| Get by id | GET | /categories/{id} | categoriesApi.get | fetchCategory | categories | — (list covers the UI need) | ❌ | 🟡 |
| Create | POST | /categories | categoriesApi.create | createCategory | categories | CatalogView category modal | ✅ | ✅ |
| Update | PATCH | /categories/{id} | categoriesApi.update | updateCategory | categories | CatalogView category modal | ✅ | ✅ |
| Delete | DELETE | /categories/{id} | categoriesApi.delete | deleteCategory | categories | CatalogView row delete | ✅ | ✅ |

## 9. Accounts (full CRUD)

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /api/v1/api/v1/accounts | accountsApi.list | fetchAccounts | accounts | CatalogView, TransactionsView, ExpensesView | ✅ | ✅ |
| Get by id | GET | /api/v1/api/v1/accounts/{id} | accountsApi.get | fetchAccountById | accounts | — (list covers the UI need) | ❌ | 🟡 |
| Create | POST | /api/v1/api/v1/accounts | accountsApi.create | createAccount | accounts | CatalogView account modal | ✅ | ✅ |
| Update | PATCH | /api/v1/api/v1/accounts/{id} | accountsApi.update | updateAccount | accounts | CatalogView account modal | ✅ | ✅ |
| Delete | DELETE | /api/v1/api/v1/accounts/{id} | accountsApi.remove | deleteAccount | accounts | CatalogView row delete | ✅ | ✅ |

## 10. Journal Entries

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /api/v1/api/v1/journal-entries | journalEntriesApi.list | fetchJournalEntries | journalEntries | TransactionsView Journal tab (+ refresh/retry) | ✅ | ✅ |
| Get by id | GET | /api/v1/api/v1/journal-entries/{id} | journalEntriesApi.get | fetchJournalEntryById | journalEntries | TransactionsView detail modal | ✅ | ✅ |
| Create draft | POST | /api/v1/api/v1/journal-entries | journalEntriesApi.create | createJournalEntry | journalEntries | TransactionsView "New Journal Entry" modal | ✅ | ✅ |
| Post | POST | /api/v1/api/v1/journal-entries/{id}/post | journalEntriesApi.post | postJournalEntry | journalEntries | TransactionsView Post button (row + modal) | ✅ | ✅ |
| Reverse | POST | /api/v1/api/v1/journal-entries/{id}/reverse | journalEntriesApi.reverse | reverseJournalEntry | journalEntries | TransactionsView Reverse button (row + modal) | ✅ | ✅ |

## 10b. GST Reporting

Backend: `@Controller('organizations/:organizationId/gst/reports')` with the single global prefix
→ `GET /api/v1/organizations/{organizationId}/gst/reports/{register}`. Required query params:
`startDate` & `endDate` (any parseable date string). Auth: Supabase JWT + `x-organization-id`
tenant header (TenantAccessGuard); organizationId always comes from
`state.organizations.activeOrganizationId` in the UI — never hardcoded.

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| Outward supply register | GET | /organizations/{orgId}/gst/reports/outward-supply | gstApi.outwardSupply | fetchGstOutwardSupply | gst | GstView (mount / period change / org change / Refresh + Retry) | ✅ | ✅ |
| Inward supply register | GET | /organizations/{orgId}/gst/reports/inward-supply | gstApi.inwardSupply | fetchGstInwardSupply | gst | GstView (same triggers as above) | ✅ | ✅ |
| GST summary (liability vs ITC vs net) | GET | /organizations/{orgId}/gst/reports/summary | gstApi.summary | fetchGstSummary | gst | GstView (same triggers as above) | ✅ | ✅ |

All three metrics cards and both register tables now render backend data (`gst.summary`,
`gst.outward.transactions`, `gst.inward.transactions`) with loading / error / empty states and a
Refresh button. The old mock computations (mock invoice/purchase-bill sums, hardcoded ₹4,000 ITC,
static HSN rows) were removed from GstView. The Export GSTR-1 JSON button now exports the fetched
registers. Note: the GSTR-2B / HSN-Summary tabs were replaced by the two live registers — the
backend has no separate GSTR-2B or HSN endpoint.

## 10c. Payments

Backend: `@Controller('api/v1/payments')` + global prefix → real route `/api/v1/api/v1/payments`
(see the URL prefix note). Business rules enforced server-side: allocations ≤ amount; invoices must
belong to the same customer and be FINALIZED/PARTIALLY_PAID/PAID (not DRAFT/CANCELLED); allocation
must not exceed the invoice's outstanding balance; `post` books DR Bank/Cash ÷ CR AR (+Customer
Advance for overpayment) and flips invoice status to PAID / PARTIALLY_PAID; only POSTED payments
can be voided, which reverses the journal entry and recomputes invoice statuses.

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| Create payment | POST | /api/v1/api/v1/payments | paymentsApi.create | createPayment | payments | SalesView drawer "Record Payment" modal ("Save Draft Only" + "Save & Post") | ✅ | ✅ |
| Post payment | POST | /api/v1/api/v1/payments/{id}/post | paymentsApi.post | postPayment | payments | SalesView "Record Payment" → "Save & Post Payment" | ✅ | ✅ |
| Void payment | POST | /api/v1/api/v1/payments/{id}/void | paymentsApi.void | voidPayment | payments | SalesView drawer "Void Payment" (posted payments of this session) | ✅ | ✅ |

There is **no GET /payments endpoint** in the backend, so the payments slice intentionally has no
fetch thunk; it tracks payments created in the current session (create/post/void responses), which
the "Void Payment" action uses. Duplicate submission is prevented via a `busyAction` lock; errors
surface the backend message via `getApiErrorMessage`. After a successful post/void the invoice is
re-fetched (`fetchInvoiceById`) so its server-computed PAID / PARTIALLY_PAID / FINALIZED status
shows in the list.

Vendor payments are integrated — see section 10d.

## 10d. Vendor Payments (full lifecycle)

Backend: `@Controller('vendor-payments')` — **no hardcoded prefix** — so the served route is the
single `/api/v1/vendor-payments` (relative paths on the apiClient). `CreateVendorPaymentDto`:
only `amount` is required; `vendorId`/`expenseId` are optional UUIDs, `paymentDate` defaults to
today server-side, `referenceNumber` optional. Lifecycle `DRAFT → POSTED → VOIDED`: **post** takes
`{ paymentAccountId }` in the body (the bank/cash account to pay from) and books the journal entry
via the payment engine; **void** (POSTED only) reverses it. Statuses per
`VendorPaymentStatus`. The backend applies no `@RequirePermissions` on this controller — auth +
tenant context still come from the shared apiClient interceptors (Bearer + `x-organization-id`).

| Module | Method | Endpoint | API Service | Redux Thunk | UI Component | dispatch() used? | Reaches API? | Mock still used? | Status |
|---|---|---|---|---|---|---|---|---|---|
| Vendor Payments | GET | /vendor-payments | vendorPaymentsApi.list | fetchVendorPayments | PurchasesView (mount / tenant switch / Refresh) | ✅ | ✅ | ❌ | ✅ |
| Vendor Payments | GET | /vendor-payments/{id} | vendorPaymentsApi.get | fetchVendorPaymentById | PurchasesView payment row / eye icon (detail modal) | ✅ | ✅ | ❌ | ✅ |
| Vendor Payments | POST | /vendor-payments | vendorPaymentsApi.create | createVendorPayment | PurchasesView "Pay Vendor" modal → "Save Draft Payment" | ✅ | ✅ | ❌ | ✅ |
| Vendor Payments | POST | /vendor-payments/{id}/post | vendorPaymentsApi.post | postVendorPayment | PurchasesView detail modal "Post Payment to Ledger" (account picker) | ✅ | ✅ | ❌ | ✅ |
| Vendor Payments | POST | /vendor-payments/{id}/void | vendorPaymentsApi.void | voidVendorPayment | PurchasesView detail modal "Void Payment" | ✅ | ✅ | ❌ | ✅ |

No mock vendor-payment data ever existed (this module was previously unimplemented on the
frontend). The payments table renders `state.vendorPayments.items` with loading / error / empty
states, success/error feedback banners, and `vpBusy` locks preventing duplicate submissions.
Posting requires choosing a bank/cash account (fetched via the accounts slice). Note: the
purchase-bill flow in the same view ("Record Vendor Bill", mock `addPurchaseBill`) belongs to the
separate `/bills` backend module and is intentionally untouched — not part of vendor payments.

## 11. Invoices (full lifecycle)

> Backend semantics (verified in read-only `invoices.controller.ts` / `invoices.service.ts`):
> the controller hardcodes `api/v1` on top of the global prefix, so the served route is
> `/api/v1/api/v1/invoices` and the service paths below include the extra `api/v1` segment
> (see the URL prefix note at the top). Invoice numbers are
> **generated by the backend at finalize time** (drafts are stored as `DRAFT-<timestamp>`).
> Statuses: `DRAFT → FINALIZED → PAID / PARTIALLY_PAID / CANCELLED`. Only DRAFT invoices can be
> updated with items or deleted; only FINALIZED invoices can be cancelled (which reverses the
> posted journal entry). `GET /invoices` returns no line items — the drawer dispatches
> `GET /invoices/{id}` on view. Finalize posts a double-entry journal automatically.

| Operation | HTTP | Endpoint | API Service | Thunk | Slice | UI Component | dispatch() | Status |
|---|---|---|---|---|---|---|---|---|
| List | GET | /api/v1/api/v1/invoices | invoicesApi.list | fetchInvoices | invoices | SalesView (mount + retry), AccountingContext (tenant change refetch) | ✅ | ✅ |
| Get by id (detail + items) | GET | /api/v1/api/v1/invoices/{id} | invoicesApi.get | fetchInvoiceById | invoices | SalesView drawer (open/view) | ✅ | ✅ |
| Create draft | POST | /api/v1/api/v1/invoices | invoicesApi.create | createInvoice | invoices | InvoiceCreationFlow "Save Draft" | ✅ | ✅ |
| Update draft | PATCH | /api/v1/api/v1/invoices/{id} | invoicesApi.update | updateInvoice | invoices | SalesView drawer "Edit Notes" | ✅ | ✅ |
| Delete draft | DELETE | /api/v1/api/v1/invoices/{id} | invoicesApi.remove | deleteInvoice | invoices | SalesView drawer "Delete Draft" | ✅ | ✅ |
| Finalize & issue | POST | /api/v1/api/v1/invoices/{id}/finalize | invoicesApi.finalize | finalizeInvoice | invoices | SalesView drawer "Finalize & Issue" | ✅ | ✅ |
| Cancel | POST | /api/v1/api/v1/invoices/{id}/cancel | invoicesApi.cancel | cancelInvoice | invoices | SalesView drawer "Cancel Invoice" | ✅ | ✅ |

Legacy UI `InvoiceStatus` mapping: `DRAFT→Draft`, `FINALIZED→Sent` (+ derived Overdue when past
due), `PARTIALLY_PAID→Partially Paid`, `PAID→Paid`, `CANCELLED→Draft`-grouped tab. Totals map
`grossSubtotal/discountTotal/taxableAmount/taxTotal/grandTotal`; per-line tax maps to IGST (the
backend keeps one tax pool per line and derives the CGST/SGST/IGST split only in GST snapshots).

## Mock / local-only areas intentionally left

These have **no backend module the existing frontend API layer covers** (endpoints exist in swagger for some, but no frontend API service/slice was ever created for them — creating those is future work, not a wiring fix):

- **Purchase bills** — PurchasesView via `AccountingContext.addPurchaseBill` (local state). No purchasesApi/slice yet.
- **Expenses** — ExpensesView via `AccountingContext.addExpense` (local state). No expensesApi/slice yet (the view only *reads* categories + accounts from the API).
- **Banking, review queue, notifications, AI insights, audit log, documents** — mock data in AccountingContext; backend modules for files/AI/notifications exist but no frontend API layer was built for them.
- **Transaction voucher (Record Transaction Voucher modal)** — local `addTransaction`; no matching backend endpoint contract in the frontend API layer.

## Removed during this pass

- `AccountingContext` no longer persists **customers, vendors, or users** to localStorage; customer/vendor lists now come from the Redux API slices (`GET /customers`, `GET /vendors`).
- `INITIAL_USERS` / `INITIAL_CUSTOMERS` / `INITIAL_VENDORS` mock seeding removed from the provider; the dead `inviteUser: undefined` context member and its mock `addCustomer` / `addVendor` mutations are gone (CustomersView / VendorsView are fully thunk-driven).
- `INITIAL_INVOICES` mock seeding, its `ai_acc_invoices` localStorage persistence, and the `addInvoice` / `updateInvoiceStatus` / `deleteInvoice` context mutations are gone. SalesView + InvoiceCreationFlow dispatch the invoicesSlice thunks directly; the SalesView create-modal dead code (never opened) was removed in favor of the editor flow.
