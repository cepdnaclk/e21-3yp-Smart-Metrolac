import { createSlice } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'

const STORAGE_KEY = 'smartmetrolac_token'

const initialState = {
  token: null,
  user: null,           // { username, role }
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called after a successful login API response.
    // action.payload = { token } — the raw JWT string from the backend.
    loginSuccess(state, action) {
      const { token } = action.payload
      const decoded = jwtDecode(token)

      // Spring Security puts the username in "sub" and the role in "role".
      state.token = token
      state.user = { username: decoded.sub, role: decoded.role }
      state.isAuthenticated = true

      // Persist the token so the session survives a page refresh.
      localStorage.setItem(STORAGE_KEY, token)
    },

    // Called when the user clicks logout.
    // Wipes all auth state and removes the token from storage.
    logout(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false

      localStorage.removeItem(STORAGE_KEY)
    },

    // Called once on app startup (e.g. in main.jsx or App.jsx) to restore
    // a previous session from localStorage without requiring a new login.
    loadAuthFromStorage(state) {
      const token = localStorage.getItem(STORAGE_KEY)

      if (!token) return  // Nothing stored — start as logged-out.

      const decoded = jwtDecode(token)

      // JWT exp is in seconds; Date.now() is in milliseconds.
      const isExpired = decoded.exp * 1000 < Date.now()

      if (isExpired) {
        // Clean up the stale token and leave state as logged-out.
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      // Token is valid — restore the session.
      state.token = token
      state.user = { username: decoded.sub, role: decoded.role }
      state.isAuthenticated = true
    },
  },
})

export const { loginSuccess, logout, loadAuthFromStorage } = authSlice.actions

export default authSlice.reducer
