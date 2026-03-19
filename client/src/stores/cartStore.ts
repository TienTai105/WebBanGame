import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartStore {
  // State
  items: CartItem[]
  total: number

  // Actions
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  calculateTotal: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      total: 0,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId)

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }

          return { items: [...state.items, item] }
        })
        set((state) => ({ total: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0) }))
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
        set((state) => ({ total: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0) }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }))
        } else {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          }))
        }
        set((state) => ({ total: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0) }))
      },

      clearCart: () => set({ items: [], total: 0 }),

      calculateTotal: () => {
        set((state) => ({
          total: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }))
      },
    }),
    {
      name: 'cart-store',
    }
  )
)
