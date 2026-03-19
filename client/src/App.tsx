import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Header, Footer, Navigation } from './components/modules'
import CartModal from './components/modules/CartModal'
import { CartProvider, useCart } from './context/CartContext'
import { warningToast } from './utils/toast'
import Home from './pages/Home'
import ProductList from './pages/ProductList'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmPage from './pages/OrderConfirmPage'
import ProductDetailPage from './components/sections/ProductDetailPage'
import Login from './pages/Login'
import Register from './pages/Register'

// Global Cart Modal Component - Handles navigation
function GlobalCartModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { closeCart } = useCart()

  return (
    <CartModal
      onViewCart={() => {
        closeCart()
        navigate('/cart')
      }}
      onCheckout={() => {
        const token = localStorage.getItem('accessToken')
        closeCart()
        if (!token) {
          warningToast('Vui lòng đăng nhập để tiếp tục thanh toán')
          navigate('/login', { state: { from: '/checkout' } })
        } else {
          navigate('/checkout')
        }
      }}
    />
  )
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()

  // Get active navigation link based on current route
  const getActiveLink = (): string => {
    const pathname = location.pathname
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/products')) return 'products'
    if (pathname.startsWith('/category/phu-kien')) return 'accessories'
    if (pathname.startsWith('/news')) return 'news'
    if (pathname.startsWith('/programs')) return 'programs'
    if (pathname.startsWith('/store')) return 'store'
    return 'home'
  }

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleAccountClick = () => {
    navigate('/account')
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Global Header */}
      <Header
        onSearch={handleSearch}
        onAccountClick={handleAccountClick}
      />

      {/* Global Navigation */}
      <Navigation activeLink={getActiveLink()} />

      {/* Page Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirm" element={<OrderConfirmPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Global Cart Modal */}
      <GlobalCartModal />

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  )
}

export default App
