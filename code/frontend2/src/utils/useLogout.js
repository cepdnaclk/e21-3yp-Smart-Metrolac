import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'

// Centralises logout logic so any component can trigger it without
// duplicating the dispatch + navigate calls.
export function useLogout() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()

  function handleLogout() {
    // Clears token from Redux state and removes it from localStorage.
    dispatch(logout())
    // Replace the current history entry so the back button can't return
    // to a protected page after logging out.
    navigate('/login', { replace: true })
  }

  return handleLogout
}
