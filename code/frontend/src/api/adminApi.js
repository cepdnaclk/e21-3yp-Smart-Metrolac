// src/api/adminApi.js

export const fetchAdminDashboardData = async () => {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/admin/dashboard`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load admin dashboard (${response.status}) from ${baseUrl}`);
  }
  return await response.json();
};