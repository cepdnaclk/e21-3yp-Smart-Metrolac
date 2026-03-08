// src/features/farmer/farmerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchFarmerDashboardData } from '../../api/farmerApi';

export const loadFarmerData = createAsyncThunk(
  'farmer/loadFarmerData',
  async (farmerId, { rejectWithValue }) => {
    try {
      return await fetchFarmerDashboardData(farmerId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const farmerSlice = createSlice({
  name: 'farmer',
  initialState: {
    paymentSummary: null,
    invoices: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFarmerData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadFarmerData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentSummary = action.payload.paymentSummary;
        state.invoices = action.payload.invoices;
      })
      .addCase(loadFarmerData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default farmerSlice.reducer;