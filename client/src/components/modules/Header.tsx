import { FC, useState, useRef, useEffect } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { LogOut, ShoppingBag } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useCart } from '../../context/CartContext'
import Button from '../atomic/Button'
import Icon from '../atomic/Icon'
import SearchBar from '../small/SearchBar'

interface HeaderProps {
  onSearch?: (query: string) => void
  onAccountClick?: () => void
  className?: string
}

/**
 * Sticky header with search, hotline, account and cart
 * @component
 */
const Header: FC<HeaderProps> = ({
  onSearch,
  className,
}) => {
  const navigate = useNavigate()
  const { items, openCart } = useCart()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (e) {
          console.error('Failed to parse user data:', e)
        }
      } else {
        setUser(null)
      }
    }

    const handleLogout = () => {
      setUser(null)
      setShowDropdown(false)
    }

    loadUser()

    // Listen for custom login event
    window.addEventListener('userLoggedIn', loadUser)
    // Listen for custom logout event
    window.addEventListener('userLoggedOut', handleLogout)
    // Also listen for storage changes
    window.addEventListener('storage', loadUser)

    return () => {
      window.removeEventListener('userLoggedIn', loadUser)
      window.removeEventListener('userLoggedOut', handleLogout)
      window.removeEventListener('storage', loadUser)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
    setShowDropdown(false)
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('userLoggedOut'))
    navigate('/login')
  }

  const handleMyOrders = () => {
    setShowDropdown(false)
    navigate('/account/orders')
  }

  return (
    <header
      className={cn(
        'w-full bg-bg-dark border-b border-primary/30',
        'sticky top-0 z-[100]',
        'backdrop-blur-md bg-opacity-90',
        className
      )}
    >
      {/* Main Header */}
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex items-center justify-between py-5 gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <RouterLink to="/" className="flex items-center gap-1 hover:opacity-80 transition">
              <span className="text-3xl font-black tracking-[0.2em] text-white font-display">
                VOLT
                <span className="text-secondary">RIX</span>
              </span>
            </RouterLink>
          </div>

          {/* Search Bar - Main */}
          <div className="flex-grow max-w-xl">
            <SearchBar
              onSearch={onSearch}
              placeholder="Tìm kiếm thiết bị gaming..."
              showButton={true}
              size="xl" 
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-8">
            {/* Hotline Info - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 border-r border-slate-700 pr-8">
              <div className="w-12 h-12 rounded-full border border-secondary/30 flex items-center justify-center text-secondary">
                <Icon name="headset_mic" size="xl" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Hotline 24/7
                </div>
                <div className="text-white font-bold text-sm tracking-tighter">
                  1900 888 999
                </div>
              </div>
            </div>

            {/* Account & Cart Buttons */}
            <div className="flex items-center gap-5">
              {/* Account Button with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                {user ? (
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-white text-sm font-semibold flex items-center gap-2 hover:text-primary"
                  >
                    <span>{user.name || user.email}</span>
                  </button>
                ) : (
                  <Button
                    variant="icon"
                    icon="person"
                    onClick={() => navigate('/login')}
                    className="text-slate-400 hover:text-primary transition-colors scale-125"
                    title="Đăng nhập"
                  />
                )}

                {/* Dropdown Menu */}
                {showDropdown && user && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50">
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-white font-semibold text-sm">{user.name || 'Tài khoản'}</p>
                      <p className="text-slate-400 text-xs mt-1">{user.email}</p>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-2">
                      {/* My Orders */}
                      <button
                        onClick={handleMyOrders}
                        className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium">Đơn hàng của tôi</span>
                      </button>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors border-t border-slate-800"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <div className="relative">
                <Button
                  variant="icon"
                  icon="shopping_cart"
                  onClick={openCart}
                  className="text-slate-400 hover:text-secondary transition-colors scale-125"
                  title="Giỏ hàng"
                />
                {items.length > 0 && (
                  <span className="absolute top-0 right-0 bg-secondary text-bg-dark text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_10px_#22D3EE]">
                    {items.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
