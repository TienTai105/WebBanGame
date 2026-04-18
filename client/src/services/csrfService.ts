import axios from 'axios'

const API_URL = 'http://localhost:5000/api'
let csrfToken: string | null = null

/**
 * Fetch and cache CSRF token from server
 */
export const fetchCsrfToken = async (): Promise<string> => {
  if (csrfToken !== null) {
    return csrfToken
  }

  try {
    const response = await axios.post(`${API_URL}/csrf-token`)

    const token = response.data?.data?.token

    if (!token) {
      throw new Error('CSRF token not found')
    }

    csrfToken = token

    console.log('✅ CSRF token fetched and cached')
    return token 
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
