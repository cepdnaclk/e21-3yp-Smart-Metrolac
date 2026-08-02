import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Settings = () => {
  const location = useLocation();
  return (
    <div className="w-full max-w-sm md:max-w-md mx-auto min-h-screen bg-transparent flex flex-col font-sans">
      <header className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md flex-none">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-8 text-slate-700">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm mb-4 border border-slate-200/20">Edit Profile</div>
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm mb-4 border border-slate-200/20">Notification Preferences</div>
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm text-red-600 border border-slate-200/20">Logout</div>
      </main>
      <nav className="flex-none bg-white/60 backdrop-blur-sm border-t flex justify-around p-3 shadow-lg">
        <Link to="/farmer/dashboard" className={`text-xs font-bold ${location.pathname === '/farmer/dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>Home</Link>
        <Link to="/farmer/reports" className={`text-xs font-bold ${location.pathname === '/farmer/reports' ? 'text-emerald-600' : 'text-slate-400'}`}>Reports</Link>
        <Link to="/farmer/settings" className={`text-xs font-bold ${location.pathname === '/farmer/settings' ? 'text-emerald-600' : 'text-slate-400'}`}>Settings</Link>
      </nav>
    </div>
  );
};
export default Settings;