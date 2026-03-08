// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { performLogin } from '../../features/auth/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Defaulted for easy testing
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    // If a user is already logged in, redirect them to their specific dashboard
    if (currentUser) {
      if (currentUser.role === 'COMPANY_ADMIN') navigate('/admin/dashboard');
      if (currentUser.role === 'CENTER_MANAGER') navigate('/manager/dashboard');
      if (currentUser.role === 'FARMER') navigate('/farmer/dashboard');
    }
  }, [currentUser, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(performLogin({ email, password }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600">Smart Metrolac</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input 
              type="email" 
              className="mt-1 block w-full rounded-md border-slate-300 border p-2 focus:border-emerald-500 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com / manager@test.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              className="mt-1 block w-full rounded-md border-slate-300 border p-2 focus:border-emerald-500 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;