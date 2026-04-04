import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'

interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
}

/**
 * Hook to get current user from AuthContext with localStorage fallback
 * Fixes timing issues where AuthContext hasn't loaded user from localStorage yet
 */
export const useCurrentUser = (): { user: User | null; isLoading: boolean } => {
  const authContext = useContext(AuthContext)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // First, try to get from AuthContext (already loaded)
    if (authContext?.user) {
      setUser(authContext.user)
      setIsLoading(false)
      return
    }

    // Fallback: check localStorage directly (for timing issues during mount)
    let storedUser = null
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        storedUser = JSON.parse(stored)
        setUser(storedUser)
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err)
    }

    // If nothing found anywhere, set loading to false
    if (!authContext?.user && !storedUser) {
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }, [authContext?.user])

  return { user, isLoading }
}
