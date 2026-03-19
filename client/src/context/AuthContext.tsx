import { createContext, useState, useEffect, ReactNode, FC } from 'react'
import { authService } from '../services/index'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const response = await authService.login({ email, password })
      const { user, accessToken } = response.data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
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
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
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
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      setUser(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const value: AuthContextType = {
    user,
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
