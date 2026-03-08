// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import adminReducer from './features/admin/adminSlice';
import invoiceReducer from './features/invoices/invoiceSlice';
import farmerReducer from './features/farmer/farmerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    invoices: invoiceReducer,
    farmer: farmerReducer,
  },
});