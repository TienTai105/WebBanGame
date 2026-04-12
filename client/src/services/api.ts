import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// ✅ CSRF token cache
let csrfToken: string | null = null

// ✅ Get fresh CSRF token
const getCsrfToken = async (): Promise<string> => {
  try {
    if (!csrfToken) {
      const response = await axios.post(
        `${API_BASE_URL}/csrf-token`,
        {},
        { withCredentials: true }
      )
      csrfToken = response.data.data.token
    }
    return csrfToken || '' // ✅ Guarantee string return
  } catch (error) {
    console.error('❌ Failed to get CSRF token:', error)
    throw error
  }
}

// Add token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // ✅ Add access token
    const token = localStorage.getItem('accessToken') // Fallback ke localStorage if needed
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // ✅ Add CSRF token for mutations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      try {
        const csrf = await getCsrfToken()
        config.headers['X-CSRF-Token'] = csrf
      } catch (error) {
        console.warn('⚠️ CSRF token not available, continuing without it')
      }
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Handle token refresh on 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // ✅ Update CSRF token if returned
    if (response.headers['x-csrf-token']) {
      csrfToken = response.headers['x-csrf-token'] as string
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // Log 401 errors with endpoint info
    if (error.response?.status === 401) {
      console.log('🔴 401 UNAUTHORIZED from:', {
        endpoint: originalRequest?.url,
        method: originalRequest?.method,
        message: error.response?.data || error.message,
        token: localStorage.getItem('accessToken') ? 'exists' : 'missing'
      })
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )
        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        // ✅ Reset CSRF token cache to fetch new one
        csrfToken = null

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        // ✅ Emit event instead of hard redirect for smooth UX
        window.dispatchEvent(new Event('tokenExpired'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
export { getCsrfToken }
