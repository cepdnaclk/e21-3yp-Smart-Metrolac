import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './app/store'
import { loadAuthFromStorage } from './features/auth/authSlice'
import './index.css'
import App from './App.jsx'

// Restore any saved session before the first render so ProtectedRoute
// sees the correct auth state immediately (avoids a flash redirect to /login).
store.dispatch(loadAuthFromStorage())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Provider makes the Redux store available to every component in the tree */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
