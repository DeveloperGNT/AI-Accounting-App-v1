import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import membershipsReducer from '../features/memberships/membershipsSlice';
import vendorsReducer from '../features/vendors/vendorsSlice';
import accountsReducer from '../features/accounts/accountsSlice';
import journalEntriesReducer from '../features/journalEntries/journalEntriesSlice';
import customersReducer from '../features/customers/customersSlice';
import usersReducer from '../features/users/usersSlice';
import organizationsReducer from '../features/organizations/organizationsSlice';
import categoriesReducer from '../features/categories/categoriesSlice';
import productsReducer from '../features/products/productsSlice';
import invoicesReducer from '../features/invoices/invoicesSlice';
import gstReducer from '../features/gst/gstSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import vendorPaymentsReducer from '../features/vendorPayments/vendorPaymentsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    organizations: organizationsReducer,
    categories: categoriesReducer,
    products: productsReducer,
    customers: customersReducer,
    memberships: membershipsReducer,
    vendors: vendorsReducer,
    accounts: accountsReducer,
    journalEntries: journalEntriesReducer,
    invoices: invoicesReducer,
    gst: gstReducer,
    payments: paymentsReducer,
    vendorPayments: vendorPaymentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;