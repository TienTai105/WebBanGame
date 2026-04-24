export const getCsrfTokenFromCookie = (): string => {
  const match = document.cookie.match(/(^| )csrfToken=([^;]+)/)
  return match ? decodeURIComponent(match[2]) : ''
}

const makeHeaders = (token: string, options?: RequestInit): HeadersInit => {
  const headers = new Headers(options?.headers)

  if (!headers.has('Content-Type') && options?.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  headers.set('Authorization', `Bearer ${token}`)

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes((options?.method || 'GET').toUpperCase())) {
    const csrfToken = getCsrfTokenFromCookie()
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }
  }

  return headers
}

export async function adminFetch<T = any>(url: string, options: RequestInit = {}): Promise<{ data: T | null; error: any }> {
  let token = localStorage.getItem('adminToken')

  if (!token) {
    throw new Error('No admin token found')
  }

  const request = async (currentToken: string) => {
    return fetch(url, {
      ...options,
      headers: makeHeaders(currentToken, options),
      credentials: 'include',
    })
  }

  let res = await request(token)

  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json().catch(() => ({}))
      const newToken = refreshData.data?.accessToken
      if (newToken) {
        localStorage.setItem('adminToken', newToken)
        token = newToken
        res = await request(newToken)
      }
    }
  }

  const data = await res.json().catch(() => ({}))
  const error = !res.ok ? data.message || data.error || `Request failed with status ${res.status}` : null

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/login'
      return { data: null, error: 'Phiên đăng nhập hết hạn' }
    }
    return { data: null, error }
  }

  return { data, error: null }
}
