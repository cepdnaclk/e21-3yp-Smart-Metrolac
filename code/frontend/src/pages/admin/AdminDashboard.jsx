// src/pages/admin/AdminDashboard.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadDashboardData } from '../../features/admin/adminSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { kpis, chartData, alerts, isLoading } = useSelector((state) => state.admin);
  const { currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    // Trigger the mock API call when the component loads
    dispatch(loadDashboardData());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Company Data...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-emerald-400">Smart Metrolac</h1>
          <p className="text-sm text-slate-400 mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block py-2.5 px-4 rounded bg-emerald-600 text-white font-medium">Dashboard Overview</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-slate-800 transition-colors">Manage Centers</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-slate-800 transition-colors">Global Pricing</a>
          <a href="#" className="block py-2.5 px-4 rounded hover:bg-slate-800 transition-colors text-red-400">System Alerts</a>
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
          Logged in as: <br/><span className="text-white font-semibold">{currentUser?.username || 'Admin'}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Company Overview</h2>
          <p className="text-slate-500">Welcome back. Here is today's network status.</p>
        </header>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Collection Centers</p>
              <p className="text-4xl font-bold text-slate-800 mt-2">{kpis.totalCenters}</p>
            </div>
            <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Registered Farmers</p>
              <p className="text-4xl font-bold text-slate-800 mt-2">{kpis.totalFarmers.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-full text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Analytics Chart */}
          <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Total Litres Collected (Current Month)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="centerName" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Legend />
                  <Bar dataKey="totalLitres" name="Litres (L)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Global Alert Feed */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              System Alerts
              <span className="text-xs bg-red-100 text-red-600 py-1 px-2 rounded-full font-bold">
                {alerts.filter(a => !a.Resolved).length} Unresolved
              </span>
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {alerts.map((alert) => (
                <div 
                  key={alert.Alert_ID} 
                  className={`p-4 rounded-lg border-l-4 shadow-sm ${
                    !alert.Resolved 
                      ? 'bg-red-50 border-red-500' 
                      : 'bg-slate-50 border-slate-300 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${!alert.Resolved ? 'text-red-700' : 'text-slate-600'}`}>
                      {alert.Alert_Type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wide ${
                      alert.Severity === 'Critical' ? 'bg-red-200 text-red-800' : 
                      alert.Severity === 'High' ? 'bg-orange-200 text-orange-800' : 
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {alert.Severity}
                    </span>
                  </div>
                  <p className={`text-sm ${!alert.Resolved ? 'text-red-900' : 'text-slate-500'}`}>
                    {alert.Message}
                  </p>
                  <div className="mt-2 text-xs font-semibold">
                    Status: {alert.Resolved ? <span className="text-emerald-600">Resolved</span> : <span className="text-red-600">Requires Attention</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;