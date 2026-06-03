import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'

// configureStore creates the Redux store and accepts a reducer map.
// Each key here will become a named slice of state (e.g. state.auth, state.readings).
const store = configureStore({
  reducer: {
    auth: authReducer,   // state.auth — holds token, user, isAuthenticated
  },
})

export default store
