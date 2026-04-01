import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/print.css'
import { Header, Footer, Navigation } from './components/modules'
import CartModal from './components/modules/CartModal'
import { CartProvider, useCart } from './context/CartContext'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import { warningToast } from './utils/toast'
import { connectSocket } from './utils/socket'
import Home from './pages/Home'
import ProductList from './pages/ProductList'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmPage from './pages/OrderConfirmPage'
import ProductDetailPage from './pages/ProductDetailPage'
import Login from './pages/Login'
import Register from './pages/Register'
import NewsListPage from './pages/NewsListPage'
import NewsDetailPage from './pages/NewsDetailPage'
import PromotionPage from './pages/PromotionPage'
import StorePage from './pages/StorePage'
import UserProfilePage from './pages/UserProfilePage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import AddressBookPage from './pages/AddressBookPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminProducts from './pages/Admin/AdminProducts'
import ProductDetail from './pages/Admin/ProductDetail'
import ProductCreate from './pages/Admin/ProductCreate'
import AdminOrders from './pages/Admin/AdminOrders'
import AdminNews from './pages/Admin/AdminNews'
import NewsCreate from './pages/Admin/NewsCreate'
import NewsDetail from './pages/Admin/NewsDetail'
import AdminSettings from './pages/Admin/AdminSettings'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminPromotions from './pages/Admin/AdminPromotions'
import AdminReviews from './pages/Admin/AdminReviews'
import AdminInventory from './pages/Admin/AdminInventory'
import AdminComments from './pages/Admin/AdminComments'
import AdminContacts from './pages/Admin/AdminContacts'
import AdminAuditLog from './pages/Admin/AdminAuditLog'

// Global Cart Modal Component - Handles navigation
function GlobalCartModal() {
  const navigate = useNavigate()
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

// Protected Admin Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin App Content - Separate layout without user Header/Navigation/Footer
function AdminAppContent() {
  return (
    <Routes>  
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
      <Route path="/admin/products/create" element={<ProtectedAdminRoute><ProductCreate /></ProtectedAdminRoute>} />
      <Route path="/admin/products/:productId" element={<ProtectedAdminRoute><ProductDetail /></ProtectedAdminRoute>} />
      <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
      <Route path="/admin/inventory" element={<ProtectedAdminRoute><AdminInventory /></ProtectedAdminRoute>} />
      <Route path="/admin/news" element={<ProtectedAdminRoute><AdminNews /></ProtectedAdminRoute>} />
      <Route path="/admin/news/create" element={<ProtectedAdminRoute><NewsCreate /></ProtectedAdminRoute>} />
      <Route path="/admin/news/:newsId" element={<ProtectedAdminRoute><NewsDetail /></ProtectedAdminRoute>} />
      <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
      <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
      <Route path="/admin/promotions" element={<ProtectedAdminRoute><AdminPromotions /></ProtectedAdminRoute>} />
      <Route path="/admin/reviews" element={<ProtectedAdminRoute><AdminReviews /></ProtectedAdminRoute>} />
      <Route path="/admin/comments" element={<ProtectedAdminRoute><AdminComments /></ProtectedAdminRoute>} />
      <Route path="/admin/contacts" element={<ProtectedAdminRoute><AdminContacts /></ProtectedAdminRoute>} />
      <Route path="/admin/audit-log" element={<ProtectedAdminRoute><AdminAuditLog /></ProtectedAdminRoute>} />
      {/* Catch-all redirect to dashboard */}
      <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

function UserAppContent() {
  const navigate = useNavigate()
  const location = useLocation()

  // Reconnect socket on mount if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) connectSocket(token)
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Get active navigation link based on current route
  const getActiveLink = (): string => {
    const pathname = location.pathname
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/products')) return 'products'
    if (pathname.startsWith('/category/phu-kien')) return 'accessories'
    if (pathname.startsWith('/news')) return 'news'
    if (pathname.startsWith('/promotions')) return 'promotions'
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
          {/* User Routes Only */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirm" element={<OrderConfirmPage />} />
          <Route path="/news" element={<NewsListPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/promotions" element={<PromotionPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/order-history" element={<OrderHistoryPage />} />
          <Route path="/address-book" element={<AddressBookPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Global Cart Modal */}
      <GlobalCartModal />
    </div>
  )
}

function AppRootContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return isAdminRoute ? <AdminAppContent /> : <UserAppContent />
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AdminAuthProvider>
          <AppRootContent />
          {/* Toast Notifications - Global */}
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
        </AdminAuthProvider>
      </CartProvider>
    </Router>
  )
}

export default App
