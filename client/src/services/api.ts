import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// ✅ Đọc CSRF token từ cookie (KHÔNG cache ở JS)
const getCsrfFromCookie = (): string => {
  const match = document.cookie.match(/(^| )csrfToken=([^;]+)/)
  const token = match ? decodeURIComponent(match[2]) : ''
  console.log('🔐 getCsrfFromCookie result:', {
    found: !!token,
    token: token ? token.substring(0, 20) + '...' : 'NOT FOUND',
    allCookies: document.cookie.substring(0, 100),
  })
  return token
}

// Add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // ✅ Add CSRF token for mutations (từ cookie)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      const csrf = getCsrfFromCookie()
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf
      }
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Handle token refresh on 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
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
      const hadAdminToken = Boolean(localStorage.getItem('adminToken'))
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )
        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        if (hadAdminToken) {
          localStorage.setItem('adminToken', accessToken)
        }

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('adminToken')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('tokenExpired'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
