import { createContext, useContext, useState, FC, ReactNode, useEffect } from 'react'

export interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  image: string
  price: number
  warranty?: string
  variant?: string
  variantSku?: string | null
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  openCart: () => void
  closeCart: () => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'webbandb_cart'

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        setItems(cartItems)
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      if (items.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } else {
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    }
  }, [items, isInitialized])

  const addItem = (item: CartItem) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.id === item.id)
      if (existingIndex !== -1) {
        // Merge quantity if same item exists
        const updatedItems = [...prevItems]
        updatedItems[existingIndex].quantity += item.quantity
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, item]
      }
    })
    setIsOpen(true)
  }

  const updateQuantity = (id: string, quantity: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const clearCart = () => setItems([])

  return (
    <CartContext.Provider value={{ items, isOpen, addItem, updateQuantity, removeItem, openCart, closeCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
