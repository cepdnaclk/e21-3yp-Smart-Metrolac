// src/features/admin/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAdminDashboardData } from '../../api/adminApi';

export const loadDashboardData = createAsyncThunk(
  'admin/loadDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchAdminDashboardData();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    kpis: { totalCenters: 0, totalFarmers: 0 },
    chartData: [],
    alerts: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboardData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.kpis = action.payload.kpis;
        state.chartData = action.payload.chartData;
        state.alerts = action.payload.alerts;
      })
      .addCase(loadDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;