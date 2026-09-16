// src/pages/farmer/FarmerDashboard.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFarmerData } from '../../features/farmer/farmerSlice';
import { Link, useLocation } from 'react-router-dom';

const FarmerDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { paymentSummary, invoices, isLoading } = useSelector((state) => state.farmer);
  const { currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadFarmerData(currentUser?.id || 1));
  }, [dispatch, currentUser]);

  if (isLoading) {
    return (
      <div className="w-full max-w-sm md:max-w-md mx-auto min-h-screen bg-transparent flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      </div>
    );
  }

  return (
    // Responsive wrapper: narrow (phone-like) width with long scrollable length
    <div className="w-full max-w-sm md:max-w-md mx-auto min-h-screen bg-transparent shadow-2xl flex flex-col font-sans">
      
      {/* 1. Header (Stays at the top) */}
      <header className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md flex-none">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-emerald-200 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-bold">{currentUser?.username || 'Farmer'}</h1>
          </div>
        </div>
        {paymentSummary && (
          <div className="bg-white/10 backdrop-blur-sm border border-emerald-400/30 p-5 rounded-2xl">
            <p className="text-emerald-100 text-xs uppercase font-semibold">March 2026 Payment</p>
            <p className="text-3xl font-extrabold text-white">Rs. {paymentSummary.Total_Amount.toLocaleString()}</p>
          </div>
        )}
      </header>

      {/* 2. Scrollable Content (Main scrollable area) */}
      <main className="flex-1 overflow-y-auto p-5">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Collections</h2>
        <div className="space-y-4">
          {invoices.map((invoice) => {
            // Restore Alert Logic
            const hasPhWarning = invoice.PH_Status !== 'Normal';
            const hasTdsWarning = invoice.TDS_Status !== 'Normal';
            const hasWarning = hasPhWarning || hasTdsWarning;

            return (
              <div key={invoice.I_ID} className={`bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border-l-4 ${hasWarning ? 'border-amber-500' : 'border-emerald-500'}`}>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-bold text-slate-800">{invoice.Date}</p>
                  <p className="text-sm font-bold text-emerald-600">Rs. {invoice.Total_Amount.toLocaleString()}</p>
                </div>
                <div className="flex text-xs text-slate-500 space-x-4 mb-2">
                  <span>Litres: {invoice.Total_Litres}</span>
                  <span>DRC: {invoice.DRC}%</span>
                </div>
                
                {/* Warning Alert Block */}
                {hasWarning && (
                  <div className="mt-2 pt-2 border-t border-slate-50 bg-amber-50 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-amber-800">Quality Flag Detected</p>
                    {hasPhWarning && <p className="text-[10px] text-amber-700">• pH: {invoice.PH_Status}</p>}
                    {hasTdsWarning && <p className="text-[10px] text-amber-700">• TDS: {invoice.TDS_Status}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. Bottom Nav */}
      <nav className="flex-none bg-white/60 backdrop-blur-sm border-t border-slate-200/20 flex justify-around p-3 shadow-lg">
        <Link to="/farmer/dashboard" className={`flex flex-col items-center ${location.pathname === '/farmer/dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/farmer/reports" className={`flex flex-col items-center ${location.pathname === '/farmer/reports' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-[10px] font-bold">Reports</span>
        </Link>
        <Link to="/farmer/settings" className={`flex flex-col items-center ${location.pathname === '/farmer/settings' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="text-[10px] font-bold">Settings</span>
        </Link>
      </nav>
    </div>
  );
};

export default FarmerDashboard;