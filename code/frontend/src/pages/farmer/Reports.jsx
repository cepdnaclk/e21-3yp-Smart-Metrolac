import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Reports = () => {
  const location = useLocation();
  return (
    <div className="w-full max-w-sm md:max-w-md mx-auto min-h-screen bg-transparent flex flex-col font-sans">
      <header className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md flex-none">
        <h1 className="text-2xl font-bold">Monthly Reports</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center text-slate-400">
        <p>No analytical data available yet.</p>
      </main>
      <nav className="flex-none bg-white/60 backdrop-blur-sm border-t flex justify-around p-3 shadow-lg">
        <Link to="/farmer/dashboard" className={`text-xs font-bold ${location.pathname === '/farmer/dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>Home</Link>
        <Link to="/farmer/reports" className={`text-xs font-bold ${location.pathname === '/farmer/reports' ? 'text-emerald-600' : 'text-slate-400'}`}>Reports</Link>
        <Link to="/farmer/settings" className={`text-xs font-bold ${location.pathname === '/farmer/settings' ? 'text-emerald-600' : 'text-slate-400'}`}>Settings</Link>
      </nav>
    </div>
  );
};
export default Reports;