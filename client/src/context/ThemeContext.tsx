import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    // Get saved theme from localStorage or default to 'system'
    const saved = localStorage.getItem('theme') as Theme | null
    const initialTheme = saved || 'system'
    setThemeState(initialTheme)
    applyTheme(initialTheme)
  }, [])

  // Apply theme to document
  const applyTheme = (themeToApply: Theme) => {
    const html = document.documentElement
    let shouldBeDark = false

    if (themeToApply === 'dark') {
      shouldBeDark = true
    } else if (themeToApply === 'system') {
      // Detect system preference
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    if (shouldBeDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    setIsDark(shouldBeDark)
    localStorage.setItem('theme', themeToApply)
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
