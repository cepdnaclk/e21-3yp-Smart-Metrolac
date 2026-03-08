// src/features/invoices/invoiceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchManagerDashboardData, submitDailyInvoice } from '../../api/invoiceApi';

export const loadManagerData = createAsyncThunk(
  'invoices/loadManagerData',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchManagerDashboardData();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      return await submitDailyInvoice(invoiceData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    deviceStatus: null,
    currentPricePerLiter: 0,
    liveDRC: 0,
    farmers: [],
    recentInvoices: [],
    isLoading: false,
    isSubmitting: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Load Initial Data
      .addCase(loadManagerData.pending, (state) => { state.isLoading = true; })
      .addCase(loadManagerData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deviceStatus = action.payload.deviceStatus;
        state.currentPricePerLiter = action.payload.currentPricePerLiter;
        state.liveDRC = action.payload.liveDRC;
        state.farmers = action.payload.farmers;
        state.recentInvoices = action.payload.recentInvoices;
      })
      // Submit New Invoice
      .addCase(createInvoice.pending, (state) => { state.isSubmitting = true; })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.isSubmitting = false;
        // Instantly add the new invoice to the top of the table
        state.recentInvoices.unshift(action.payload.newInvoice); 
      });
  },
});

export default invoiceSlice.reducer;