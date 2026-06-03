import axiosClient from './axiosClient'

// Authenticate a user with username + password.
// On success the backend returns a JWT; the caller dispatches loginSuccess with it.
export async function loginApi(username, password) {
  try {
    const response = await axiosClient.post('/api/auth/login', { username, password })
    return response.data
  } catch (error) {
    throw error
  }
}

// Allow a logged-in user to change their own password.
export async function changePasswordApi(currentPassword, newPassword) {
  try {
    const response = await axiosClient.put('/api/users/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// Admin action: reset a farmer's password back to a default (no body required).
export async function resetFarmerPasswordApi(userId) {
  try {
    const response = await axiosClient.put(`/api/users/${userId}/reset-password`)
    return response.data
  } catch (error) {
    throw error
  }
}
