import axios from 'axios'

const API_URL = 'http://localhost:5000/api'
let csrfToken: string | null = null

/**
 * Fetch and cache CSRF token from server
 */
export const fetchCsrfToken = async (): Promise<string> => {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken
  }

  try {
    const response = await axios.post(`${API_URL}/csrf-token`)
    csrfToken = response.data.data.token
    console.log('✅ CSRF token fetched and cached')
    return csrfToken
  } catch (error: any) {
    console.error('❌ Failed to fetch CSRF token:', error.message)
    throw error
  }
}

/**
 * Get cached CSRF token (fetch if not available)
 */
export const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    return await fetchCsrfToken()
  }
  return csrfToken
}

/**
 * Clear cached CSRF token (call on logout)
 */
export const clearCsrfToken = () => {
  csrfToken = null
  console.log('🧹 CSRF token cleared')
}
