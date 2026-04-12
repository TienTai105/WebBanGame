/**
 * Admin API Client with Auto Token Refresh
 * Automatically refreshes expired admin JWT tokens
 */

const API_BASE_URL = '/api'

// ✅ CSRF token cache
let csrfToken: string | null = null

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/**
 * Get CSRF token for mutations
 */
async function getCsrfToken(): Promise<string> {
  try {
    if (!csrfToken) {
      const response = await fetch(`${API_BASE_URL}/csrf-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await response.json()
      csrfToken = data.data?.token
    }
    return csrfToken || ''
  } catch (error) {
    console.error('❌ Failed to get CSRF token:', error)
    throw error
  }
}

/**
 * Refresh admin token when expired
 */
async function refreshAdminToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send cookies automatically
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    const newAccessToken = data.data?.accessToken

    if (newAccessToken) {
      localStorage.setItem('adminToken', newAccessToken)
      return newAccessToken
    }

    return null
  } catch (error) {
    console.error('Token refresh error:', error)
    // Clear invalid tokens and redirect to login
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    window.location.href = '/login'
    return null
  }
}

/**
 * Make authenticated API request with auto token refresh
 */
export async function adminApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    let token = localStorage.getItem('adminToken')

    if (!token) {
      throw new Error('No admin token found')
    }

    console.log('Admin API Call:', endpoint)
    console.log('Token:', token.substring(0, 20) + '...')

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
      Authorization: `Bearer ${token}`,
    }

    // ✅ Add CSRF token for mutations (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes((options.method || 'GET').toUpperCase())) {
      try {
        const csrf = await getCsrfToken()
        headers['X-CSRF-Token'] = csrf
      } catch (error) {
        console.warn('⚠️ CSRF token not available:', error)
      }
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Send cookies
      headers,
    })

    console.log('Response Status:', response.status, response.statusText)

    // If 401 (token expired), try refreshing and retry
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...')
      token = await refreshAdminToken()

      if (!token) {
        throw new Error('Failed to refresh token')
      }

      // Retry the request with new token
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // Send cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers as Record<string, string>,
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': headers['X-CSRF-Token'],
        },
      })
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      )
    }

    const responseData = await response.json() as ApiResponse<T>
    console.log('Response Data:', responseData)
    return { data: responseData.data, error: null }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Admin API Error:', err.message)
    return { data: null, error: err }
  }
}

export default adminApiCall
