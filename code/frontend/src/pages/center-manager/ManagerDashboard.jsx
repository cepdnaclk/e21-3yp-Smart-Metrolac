// src/pages/center-manager/ManagerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadManagerData, createInvoice } from '../../features/invoices/invoiceSlice';

const ManagerDashboard = () => {
  const dispatch = useDispatch();
  const { 
    deviceStatus, currentPricePerLiter, liveDRC, 
    farmers, recentInvoices, isLoading, isSubmitting 
  } = useSelector((state) => state.invoices);

  // Local state for the form
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [liters, setLiters] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0.00);

  // State for the searchable dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    dispatch(loadManagerData());
  }, [dispatch]);

  // Live Calculation Effect
  useEffect(() => {
    if (liters && liveDRC && currentPricePerLiter) {
      // Formula: Total_Litres * Price_Per_Liter * (DRC/100)
      const total = parseFloat(liters) * currentPricePerLiter * (liveDRC / 100);
      setCalculatedTotal(total);
    } else {
      setCalculatedTotal(0.00);
    }
  }, [liters, liveDRC, currentPricePerLiter]);

  // Filter farmers based on search input
  const filteredFarmers = farmers.filter(f => 
    f.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFarmerId || !liters) return;

    const farmer = farmers.find(f => f.F_ID === parseInt(selectedFarmerId));
    
    dispatch(createInvoice({
      farmerName: farmer.Name,
      Total_Litres: parseFloat(liters),
      DRC: liveDRC,
      Total_Amount: calculatedTotal
    })).then(() => {
      // Clear form on success
      setLiters('');
      setSelectedFarmerId('');
      setSearchQuery(''); // Also clear the search bar
    });
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-xl text-slate-500 animate-pulse">Initializing Hub...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Collection Hub</h2>
          <p className="text-slate-500">Record daily latex intake and monitor device status.</p>
        </div>
        
        {/* Active Device Status Card */}
        {deviceStatus && (
          <div className="bg-white border border-emerald-200 px-4 py-3 rounded-lg shadow-sm flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">IoT Sensor Link</p>
              <p className="text-sm font-bold text-slate-800">Device {deviceStatus.id}: <span className="text-emerald-600">{deviceStatus.status}</span></p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Create Invoice Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">New Latex Collection</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Custom Searchable Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Farmer</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-md p-2.5 pr-10 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Type farmer name to search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedFarmerId(''); // Reset ID if they type a new name
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  required={!selectedFarmerId} // Only require text if no farmer is actually selected yet
                />
                
                {/* The clickable dropdown arrow icon */}
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                {/* The Dropdown List */}
                {isDropdownOpen && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredFarmers.length > 0 ? (
                      filteredFarmers.map((f) => (
                        <li
                          key={f.F_ID}
                          className="px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-slate-700 border-b border-slate-50 last:border-b-0"
                          onClick={() => {
                            setSelectedFarmerId(f.F_ID);
                            setSearchQuery(f.Name); // Fill input with selected name
                            setIsDropdownOpen(false); // Close dropdown
                          }}
                        >
                          {f.Name}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-slate-400 text-sm cursor-default">No farmers found...</li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Litres Collected</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                  placeholder="0.0"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                  Live DRC % 
                  <span className="text-xs text-emerald-500 flex items-center"><svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>Auto</span>
                </label>
                <input 
                  type="text" 
                  readOnly
                  className="w-full border border-emerald-200 bg-emerald-50 rounded-md p-2.5 text-emerald-700 font-bold text-lg cursor-not-allowed"
                  value={`${liveDRC}%`}
                />
              </div>
            </div>

            {/* Live Calculation Display */}
            <div className="bg-slate-800 rounded-lg p-5 mt-4 text-white shadow-inner">
              <div className="flex justify-between items-center mb-2 text-slate-300 text-sm border-b border-slate-600 pb-2">
                <span>Current Daily Price:</span>
                <span>Rs. {currentPricePerLiter.toFixed(2)} / kg</span>
              </div>
              <div className="flex justify-between items-end mt-3">
                <span className="text-sm font-medium uppercase tracking-wide text-slate-400">Total Payout</span>
                <span className="text-3xl font-bold text-emerald-400">Rs. {calculatedTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !selectedFarmerId || !liters}
              className={`w-full py-3 rounded-md font-bold text-white transition-all ${isSubmitting || !selectedFarmerId || !liters ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
            >
              {isSubmitting ? 'Saving to Database...' : 'Record Invoice'}
            </button>
          </form>
        </div>

        {/* Recent Invoices Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Collections</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-sm">
                  <th className="p-3 font-semibold">Time</th>
                  <th className="p-3 font-semibold">Farmer</th>
                  <th className="p-3 font-semibold text-right">Litres</th>
                  <th className="p-3 font-semibold text-right">DRC</th>
                  <th className="p-3 font-semibold text-right">Payout (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((invoice, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-sm text-slate-500 whitespace-nowrap">{invoice.Time}</td>
                    <td className="p-3 text-sm font-medium text-slate-800">{invoice.FarmerName}</td>
                    <td className="p-3 text-sm text-right text-slate-600">{invoice.Total_Litres} L</td>
                    <td className="p-3 text-sm text-right font-semibold text-blue-600">{invoice.DRC}%</td>
                    <td className="p-3 text-sm text-right font-bold text-emerald-600">{invoice.Total_Amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400">No collections recorded yet today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;