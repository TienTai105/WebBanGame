import { AxiosRequestConfig } from 'axios'
import api from '../services/api'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/**
 * Make authenticated admin API request using the shared axios client.
 * This avoids a second CSRF/token implementation and uses the cookie-based CSRF approach.
 */
export async function adminApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('No admin token found')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    }

    const axiosConfig: AxiosRequestConfig = {
      url: endpoint,
      method: (options.method as AxiosRequestConfig['method']) || 'GET',
      headers,
      withCredentials: true,
    }

    if (options.body !== undefined) {
      axiosConfig.data = options.body
    }

    const response = await api.request<ApiResponse<T>>(axiosConfig)
    return { data: response.data.data, error: null }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Admin API Error:', err.message)
    return { data: null, error: err }
  }
}

export default adminApiCall
