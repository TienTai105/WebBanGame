import { create } from 'zustand'

interface UIStore {
  // State
  sidebarOpen: boolean
  theme: 'light' | 'dark'

  // Actions
  toggleSidebar: () => void
  closeSidebar: () => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  theme: 'light',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (theme) => set({ theme }),
}))
