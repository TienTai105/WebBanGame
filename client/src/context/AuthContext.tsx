import { createContext, useState, useEffect, ReactNode, FC } from 'react'
import { authService } from '../services/index'
import { connectSocket, disconnectSocket } from '../utils/socket'

interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  accessToken: string | null // ✅ Add accessToken to context
  login: (email: string, password: string) => Promise<any>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<any>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null) // ✅ Store token in state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Auto-refresh token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in from localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          
          // Try to refresh token (refreshToken is in httpOnly cookie)
          try {
            const response = await authService.refreshToken()
            if (response.data.data.accessToken) {
              const token = response.data.data.accessToken
              setAccessToken(token)
              connectSocket(token)
              console.log('✅ [AUTH] Token refreshed on mount')
            }
          } catch (refreshError) {
            // If refresh fails, clear user
            console.warn('⚠️ [AUTH] Token refresh failed, logging out')
            localStorage.removeItem('user')
            setUser(null)
            setAccessToken(null)
          }
        }
      } catch (err) {
        console.error('❌ [AUTH] Auto-check failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const response = await authService.login({ email, password })
      const { user, accessToken } = response.data.data
      setAccessToken(accessToken) // ✅ Store in state, not localStorage
      localStorage.setItem('user', JSON.stringify(user)) // ✅ Only store user
      setUser(user)
      connectSocket(accessToken)
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      throw err
    }
  }

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    setError(null)
    try {
      const response = await authService.register({
        name,
        email,
        password,
        confirmPassword,
      })
      const { user, accessToken } = response.data.data
      setAccessToken(accessToken) // ✅ Store in state, not localStorage
      localStorage.setItem('user', JSON.stringify(user)) // ✅ Only store user
      setUser(user)
      connectSocket(accessToken)
      return response.data
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      localStorage.removeItem('user')
      disconnectSocket()
      setUser(null)
      setAccessToken(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const value: AuthContextType = {
    user,
    accessToken, // ✅ Expose token from context
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
