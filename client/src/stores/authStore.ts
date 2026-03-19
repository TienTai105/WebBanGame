import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/index'

interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
}

interface AuthStore {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login({ email, password })
          const { user, accessToken } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err: any) {
          const message = err.response?.data?.message || 'Login failed'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      register: async (name: string, email: string, password: string, confirmPassword: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.register({
            name,
            email,
            password,
            confirmPassword,
          })
          const { user, accessToken } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err: any) {
          const message = err.response?.data?.message || 'Registration failed'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch (err) {
          console.error('Logout error:', err)
        } finally {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false, error: null })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // Only persist user and isAuthenticated
    }
  )
)
