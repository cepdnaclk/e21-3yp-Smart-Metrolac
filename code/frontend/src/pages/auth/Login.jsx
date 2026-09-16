// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { performLogin } from '../../features/auth/authSlice';
import bg from '../../assets/login-bg.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Defaulted for easy testing
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
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
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* dark overlay over background for contrast */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex">
        {/* Left: form (transparent, no gray background) */}
        <div className="w-full md:w-1/2 flex items-start justify-start">
          <div className="w-full max-w-md p-8 md:p-12 pl-16 md:pl-24">
            <h1 className="text-5xl font-extrabold text-white mb-8">Login</h1>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full bg-white/6 text-white placeholder:text-slate-300 rounded-xl border border-white/20 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-white/6 text-white placeholder:text-slate-300 rounded-xl border border-white/20 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1.05 12s4-7 10.95-7 10.95 7 10.95 7-4 7-10.95 7S1.05 12 1.05 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-white font-semibold ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'}`}
              >
                {isLoading ? 'Signing in...' : 'Log in'}
              </button>

              <div className="text-sm text-slate-200 mt-2">
                <a href="#" className="hover:underline">Forgot your password?</a>
              </div>
            </form>
          </div>
        </div>

        {/* Right: intentionally left blank so background image shows through */}
        <div className="hidden md:block md:w-1/2" />
      </div>
    </div>
  );
};

export default Login;