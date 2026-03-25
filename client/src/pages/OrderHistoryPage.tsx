import { FC, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/atomic'
import Button from '../components/atomic/Button'
import Pagination from '../components/modules/Pagination'
import ProfileSidebar from '../components/modules/ProfileSidebar'
import { cn } from '../utils/cn'
import api from '../services/api'
import { toast } from 'react-toastify'

interface OrderItem {
  _id?: string
  name: string
  image?: string
  quantity: number
  variant?: string
  warranty?: string
}

interface Order {
  _id: string
  orderCode: string
  orderStatus: 'pending' | 'processing' | 'shipped' | 'completed' | 'failed' | 'cancelled'
  orderItems: OrderItem[]
  totalPrice: number
  finalPrice: number
  paymentStatus: 'paid' | 'unpaid' | 'failed'
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse {
  success: boolean
  data: Order[]
  count: number
  total: number
  pages: number
}

interface UserData {
  name: string
  avatar?: string
  role: 'customer' | 'staff' | 'admin'
}

const OrderHistoryPage: FC = () => {
  const navigate = useNavigate()
  const filterDetailsRef = useRef<HTMLDetailsElement>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUserData()
    fetchOrders()
  }, [currentPage, filterStatus, navigate])

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.data.user)
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const query = new URLSearchParams()
      query.append('page', currentPage.toString())
      query.append('limit', '5')
      if (filterStatus) {
        query.append('status', filterStatus)
      }

      const response = await api.get<PaginatedResponse>(`/orders/my-orders?${query.toString()}`)
      
      if (response.data.success) {
        setOrders(response.data.data)
        setTotalPages(response.data.pages)
      }
    } catch (err: any) {
      console.error('Failed to fetch orders:', err)
      const errorMsg = err.response?.data?.message || 'Failed to load order history'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'COMPLETED', icon: 'check_circle' },
      shipped: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'SHIPPED', icon: 'local_shipping' },
      processing: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'PROCESSING', icon: 'schedule' },
      pending: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'PENDING', icon: 'pending_actions' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'CANCELLED', icon: 'cancel' },
      failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'FAILED', icon: 'error' },
    }

    const config = statusConfig[status] || statusConfig.pending
    return config
  }

  const handlePaginationClick = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filterOptions = [
    { value: '', label: 'All Orders' },
    { value: 'completed', label: 'Completed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'processing', label: 'Processing' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <main
      className="min-h-screen bg-slate-950 relative overflow-hidden"
      style={{
        backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, 
          rgba(15, 23, 42, 1) 0%,
          rgba(30, 27, 75, 0.5) 25%,
          rgba(15, 23, 42, 1) 50%,
          rgba(30, 27, 75, 0.5) 75%,
          rgba(15, 23, 42, 1) 100%)
      `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
        `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 flex gap-8">
          {/* LEFT SIDEBAR */}
          {user && <ProfileSidebar userName={user.name} memberLevel="Pro Member" avatar={user.avatar} />}

          {/* CENTER CONTENT */}
          <div className="flex-1 min-w-0">
            {/* Header with Filter */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Lịch sử đơn hàng</h1>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Quản lý các giao dịch kỹ thuật số của bạn. Theo dõi các đơn hàng vật lý và tải xuống hóa đơn cho tất cả các giao dịch của bạn với Voltrix.
                </p>
              </div>

              {/* Filter Dropdown - Custom Details */}
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Filter By Status
                </label>
                <details ref={filterDetailsRef} className="group relative">
                  <summary className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg text-white text-sm cursor-pointer transition list-none backdrop-blur-sm">
                    <span className="font-medium">
                      {filterStatus === '' && 'All Orders'}
                      {filterStatus === 'completed' && 'Completed'}
                      {filterStatus === 'shipped' && 'Shipped'}
                      {filterStatus === 'processing' && 'Processing'}
                      {filterStatus === 'pending' && 'Pending'}
                      {filterStatus === 'cancelled' && 'Cancelled'}
                    </span>
                    <Icon name="expand_more" size="sm" className="group-open:rotate-180 transition text-indigo-400" />
                  </summary>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-indigo-500/30 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-sm">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value || 'all'}
                        onClick={() => {
                          setFilterStatus(option.value)
                          setCurrentPage(1)
                          filterDetailsRef.current?.removeAttribute('open')
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition border-l-2 ${
                          filterStatus === option.value
                            ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400'
                            : 'text-slate-300 border-l-transparent hover:bg-indigo-700/30'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-white text-lg mb-2 font-bold">Loading orders...</div>
                  <div className="text-slate-400 text-sm">Please wait...</div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && orders.length === 0 && (
              <div className="bg-slate-900/30 border border-indigo-500/20 rounded-xl p-12 text-center">
                <Icon name="shopping_bag" size="lg" className="text-slate-500 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-2">No Orders Yet</p>
                <p className="text-slate-400 text-sm mb-6">You haven't made any purchases yet. Start shopping now!</p>
                <Button
                  onClick={() => navigate('/games')}
                  variant="primary"
                  size="md"
                  className="mx-auto"
                >
                  <Icon name="shopping_cart" size="sm" />
                  Browse Games
                </Button>
              </div>
            )}

            {/* Orders List */}
            {!isLoading && orders.length > 0 && (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusConfig = getStatusBadge(order.orderStatus)
                  const orderDate = new Date(order.createdAt)
                  const formattedDate = orderDate.toLocaleDateString('vi-VN')

                  return (
                    <div
                      key={order._id}
                      className="bg-slate-900/30 border border-indigo-500/20 rounded-xl overflow-hidden hover:border-indigo-500/40 transition group"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Product Image */}
                          <div className="w-full lg:w-24 h-24 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={order.orderItems[0]?.image || 'https://via.placeholder.com/96?text=No+Image'}
                              alt={order.orderItems[0]?.name || 'Order'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image'
                              }}
                            />
                          </div>

                          {/* Order Info */}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="text-slate-400 text-xs font-bold">ORDER CODE</p>
                                  <p className="text-white font-bold text-sm">#{order.orderCode}</p>
                                </div>
                                <p className="text-slate-400 text-xs">{formattedDate}</p>
                              </div>
                              <div
                                className={cn(
                                  'inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap',
                                  statusConfig.color
                                )}
                              >
                                <Icon name={statusConfig.icon} size="xs" />
                                {statusConfig.label}
                              </div>
                            </div>

                            {/* Products */}
                            <div className="mb-4">
                              {order.orderItems.map((item, idx) => (
                                <div key={idx} className="text-sm mb-2">
                                  <p className="text-white font-medium">{item.name}</p>
                                  {item.variant && (
                                    <p className="text-slate-400 text-xs">Loại: {item.variant}</p>
                                  )}
                                  {item.warranty && (
                                    <p className="text-slate-400 text-xs">Bảo hành: {item.warranty}</p>
                                  )}
                                  {order.orderItems.length > 1 && idx === 0 && order.orderItems.length > 1 && (
                                    <p className="text-slate-400 text-xs italic">+ {order.orderItems.length - 1} more item(s)</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Price and Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-700/50">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">TOTAL</p>
                                <p className="text-indigo-400 font-black text-lg">
                                  {order.finalPrice.toLocaleString('vi-VN')} ₫
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="text-indigo-400 hover:text-indigo-300 font-bold text-sm flex items-center gap-1 transition group/link"
                              >
                                View Details
                                <Icon name="arrow_forward" size="xs" className="group-hover/link:translate-x-1 transition" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && orders.length > 0 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePaginationClick}
                  maxVisiblePages={3}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default OrderHistoryPage
