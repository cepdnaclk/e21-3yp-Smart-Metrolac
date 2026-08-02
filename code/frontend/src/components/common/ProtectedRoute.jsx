// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import insideBg from '../../assets/inside-bg.jpg';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useSelector((state) => state.auth);

  if (!currentUser) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Logged in but wrong role, redirect to a safe default or show an error
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="p-8 bg-white/90 backdrop-blur-sm rounded shadow-md text-center border border-slate-200/20">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${insideBg})` }}
    >
      <div className="min-h-screen bg-black/40">
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute;