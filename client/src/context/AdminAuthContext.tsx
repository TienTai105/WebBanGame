import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react'

interface AdminUser {
  _id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  avatar?: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  generateOTP: (action: string) => Promise<{ otpId: string; expiresAt: string }>
  verifyOTP: (otpId: string, code: string) => Promise<{ otpToken: string }>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

// Helper to get initial user from localStorage
const getInitialUser = (): AdminUser | null => {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('adminUser')
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(getInitialUser())
  const [isLoading, setIsLoading] = useState(false)

  // Watch localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('adminUser')
      if (saved) {
        try {
          setUser(JSON.parse(saved))
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }

    // Listen to storage changes (from other tabs)
    window.addEventListener('storage', handleStorageChange)

    // Custom event for same-tab changes (from Login.tsx)
    window.addEventListener('adminAuthChanged', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('adminAuthChanged', handleStorageChange)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Check if user is admin or staff
      const userData = data.data.user
      if (!['admin', 'staff'].includes(userData.role)) {
        throw new Error('Unauthorized: Admin/Staff access required')
      }

      // Save token and user data
      localStorage.setItem('adminToken', data.data.accessToken)
      localStorage.setItem('adminUser', JSON.stringify(userData))
      setUser(userData)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    // Also clear user data if exists
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    setUser(null)
    // Notify other components
    window.dispatchEvent(new Event('userLoggedOut'))
    // Hard redirect to login
    window.location.href = '/login'
  }

  const generateOTP = async (action: string) => {
    const token = localStorage.getItem('adminToken')
    const response = await fetch('/api/admin/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate OTP')
    }

    return data.data
  }

  const verifyOTP = async (otpId: string, code: string) => {
    const token = localStorage.getItem('adminToken')
    const response = await fetch('/api/admin/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ otpId, code }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify OTP')
    }

    return data.data
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        generateOTP,
        verifyOTP,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
