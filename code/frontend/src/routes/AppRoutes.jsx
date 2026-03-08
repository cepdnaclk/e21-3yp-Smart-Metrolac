// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Import all the actual page components we built
import Login from '../pages/auth/Login';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManagerDashboard from '../pages/center-manager/ManagerDashboard';
import FarmerDashboard from '../pages/farmer/FarmerDashboard';
import Reports from '../pages/farmer/Reports';
import Settings from '../pages/farmer/Settings';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Default redirect based on nothing being selected */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Company Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['COMPANY_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Center Manager Routes */}
        <Route 
          path="/manager/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['CENTER_MANAGER']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Farmer Routes */}
        <Route 
          path="/farmer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/farmer/reports" 
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/farmer/settings" 
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;