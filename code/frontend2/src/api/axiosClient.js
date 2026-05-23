import axios from 'axios'

const STORAGE_KEY = 'smartmetrolac_token'

// A pre-configured axios instance shared across all API calls.
// Using an instance (instead of axios directly) lets us set defaults and
// attach interceptors in one place rather than repeating them per request.
const axiosClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,  // Abort requests that take longer than 10 seconds.
})

// REQUEST INTERCEPTOR
// Runs before every outgoing request.
// Its job is to attach the JWT so the backend can verify who is calling.
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY)

    if (token) {
      // The Authorization header is the standard way to send a bearer token.
      // Spring Security reads this header to authenticate the request.
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// RESPONSE INTERCEPTOR
// Runs after every response (or failed response) comes back from the server.
// Its job is to handle global error cases so individual API calls don't have to.
axiosClient.interceptors.response.use(
  // Success path (2xx): pass the response straight through to the caller.
  (response) => response,

  // Error path (non-2xx): inspect the status and act accordingly.
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login')

    if (error.response?.status === 401 && !isLoginRequest) {
      // 401 on a protected endpoint — token is missing, expired, or invalid.
      // Clear the stale token and send the user back to the login page.
      // We skip this for the login endpoint itself so that a wrong-password
      // 401 is handled by LoginPage (shows an error) rather than redirecting.
      localStorage.removeItem(STORAGE_KEY)
      window.location.href = '/login'
    }

    // Always forward the error so individual callers can handle other
    // status codes (400 validation errors, 403 forbidden, 500 server errors, etc.).
    return Promise.reject(error)
  },
)

export default axiosClient
