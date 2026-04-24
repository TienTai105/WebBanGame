import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import OTPVerificationModal from '../../components/admin/OTPVerificationModal'
import PackingSlipTab from '../../components/admin/PackingSlipTab'
import { errorToast, successToast } from '../../utils/toast'
import { adminFetch } from '../../utils/adminFetch'

// ── Types ──────────────────────────────────────────────────
interface OrderUser {
  _id: string
  name: string
  email: string
  phone?: string
}

interface OrderItem {
  product: { _id: string; name: string; slug: string; images?: { url: string }[]; price: number } | string
  variantSku?: string
  variant?: string
  warranty?: string
  quantity: number
  name: string
  image?: string
  priceAtPurchase: number
  price: number
}

interface ShippingAddress {
  name: string
  address: string
  city: string
  phone: string
  ward?: string
  district?: string
  email?: string
}

interface Order {
  _id: string
  orderCode: string
  user: OrderUser
  orderItems: OrderItem[]
  totalPrice: number
  discountAmount: number
  shippingFee: number
  finalPrice: number
  paymentMethod: string
  paymentStatus: 'unpaid' | 'paid'
  orderStatus: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'failed' | 'refunded'
  shippingAddress: ShippingAddress
  trackingNumber?: string
  discountCode?: string
  createdAt: string
  updatedAt: string
}

// ── Helpers ────────────────────────────────────────────────
const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

type OrderStatus = Order['orderStatus']
type PaymentStatus = Order['paymentStatus']

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string; border: string; dot?: string }> = {
  pending:    { label: 'Chờ Xử Lý',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  processing: { label: 'Đang Xử Lý', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  shipped:    { label: 'Đang Giao',   color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  dot: 'bg-indigo-500' },
  completed:  { label: 'Thành Công',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Đã Hủy',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500' },
  failed:     { label: 'Thất Bại',    color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   dot: 'bg-slate-400' },
  refunded:   { label: 'Hoàn Tiền',   color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500' },
}

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; dot?: string }> = {
  paid:   { label: 'Đã Trả',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  unpaid: { label: 'Chưa Trả',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500' },
}

type StatusTab = 'all' | OrderStatus
const STATUS_TABS: { key: StatusTab; label: string; borderColor: string; textColor: string }[] = [
  { key: 'all',        label: 'Tất Cả',     borderColor: 'border-indigo-500', textColor: '' },
  { key: 'pending',    label: 'Chờ Xử Lý',  borderColor: 'border-amber-400',  textColor: 'text-amber-600' },
  { key: 'shipped',    label: 'Đang Giao',   borderColor: 'border-blue-400',   textColor: 'text-blue-600' },
  { key: 'completed',  label: 'Hoàn Thành',  borderColor: 'border-emerald-400', textColor: 'text-emerald-600' },
  { key: 'cancelled',  label: 'Đã Hủy',     borderColor: 'border-red-400',    textColor: 'text-red-600' },
]

// ── Safe Status Getters ────────────────────────────────────
const DEFAULT_STATUS = { label: 'Không xác định', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' }

const getOrderStatus = (status: any) => {
  return ORDER_STATUS_MAP[status as OrderStatus] || DEFAULT_STATUS
}

const getPaymentStatus = (status: any) => {
  return PAYMENT_STATUS_MAP[status as PaymentStatus] || DEFAULT_STATUS
}

// ── Status Transition Validation ───────────────────────────
// Define which status transitions are allowed
const isValidStatusTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  // Cannot change terminal states (completed, cancelled, refunded)
  if (['completed', 'cancelled', 'refunded'].includes(from)) return false
  
  // From pending: can go to processing or cancelled
  if (from === 'pending') return ['processing', 'cancelled'].includes(to)
  
  // From processing: can go to shipped
  if (from === 'processing') return to === 'shipped'
  
  // From shipped: can go to completed
  if (from === 'shipped') return to === 'completed'
  
  // From failed: can retry to pending
  if (from === 'failed') return to === 'pending'
  
  return false
}

const getInvalidTransitionMessage = (from: OrderStatus, to: OrderStatus): string => {
  const fromLabel = getOrderStatus(from).label
  const toLabel = getOrderStatus(to).label
  
  if (['completed', 'cancelled', 'refunded'].includes(from)) {
    return `❌ Không thể thay đổi đơn hàng ở trạng thái "${fromLabel}". Đây là trạng thái cuối cùng.`
  }
  
  if (from === 'pending') {
    return `❌ Không thể chuyển từ "Chờ Xử Lý" sang "${toLabel}".\n\n✓ Chỉ có thể: Xử lý hoặc Hủy đơn`
  }
  
  if (from === 'processing') {
    return `❌ Không thể chuyển từ "Đang Xử Lý" sang "${toLabel}".\n\n✓ Chỉ có thể: Giao hàng`
  }
  
  if (from === 'shipped') {
    return `❌ Không thể chuyển từ "Đang Giao" sang "${toLabel}".\n\n✓ Chỉ có thể: Hoàn thành`
  }
  
  return `❌ Không thể chuyển từ "${fromLabel}" sang "${toLabel}".`
}

// ── Component ──────────────────────────────────────────────
const AdminOrders: React.FC = () => {
  // Error boundary state
  const [renderError, setRenderError] = useState<string | null>(null)

  // Handle render errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('AdminOrders render error:', event.error)
      setRenderError(event.error?.message || 'Lỗi hiển thị không xác định')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // View mode
  const [viewMode, setViewMode] = useState<'orders' | 'packingslips'>('orders')

  // Data
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const LIMIT = 10

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingStatus, setEditingStatus] = useState(false)
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('pending')
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [editTrackingNumber, setEditTrackingNumber] = useState('')
  const [updating, setUpdating] = useState(false)
  const [otpModal, setOtpModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ type: 'status'; orderId: string; status: OrderStatus } | { type: 'edit' } | null>(null)

  // ── Fetch orders ─────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(LIMIT))
      if (activeTab !== 'all') params.set('status', activeTab)

      const { data: json, error } = await adminFetch(`/api/orders/admin/all?${params}`)
      if (error) throw error
      setOrders(json.data || [])
      setTotalOrders(json.total || 0)
      setTotalPages(json.pages || 1)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }, [currentPage, activeTab, adminFetch])

  // Fetch status counts for tabs
  const fetchStatusCounts = useCallback(async () => {
    try {
      const statuses: (OrderStatus | 'all')[] = ['all', 'pending', 'shipped', 'completed', 'cancelled']
      const counts: Record<string, number> = {}

      const promises = statuses.map(async (status) => {
        const url = status === 'all'
          ? '/api/orders/admin/all?limit=1'
          : `/api/orders/admin/all?limit=1&status=${status}`
        try {
          const { data: json, error } = await adminFetch(url)
          if (error) throw error
          counts[status] = json.total ?? 0
        } catch { /* silent */ }
      })
      await Promise.all(promises)
      setStatusCounts(counts)
    } catch {
      // silent
    }
  }, [adminFetch])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { fetchStatusCounts() }, [fetchStatusCounts])

  // ── Update order status ──────────────────────────────────
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {    // Find the order to get current status
    const order = orders.find(o => o._id === orderId)
    if (!order) return
    
    // Validate status transition
    if (!isValidStatusTransition(order.orderStatus, newStatus)) {
      const message = getInvalidTransitionMessage(order.orderStatus, newStatus)
      errorToast(message)
      return
    }
        setPendingAction({ type: 'status', orderId, status: newStatus })
    setOtpModal(true)
  }

  const handleOTPVerified = async (otpToken: string) => {
    setOtpModal(false)
    if (!pendingAction) return
    const headers: Record<string, string> = otpToken ? { otpToken } : {}

    if (pendingAction.type === 'status') {
      try {
        await adminFetch(`/api/orders/${pendingAction.orderId}`, {
          method: 'PUT',
          body: JSON.stringify({ orderStatus: pendingAction.status }),
          headers,
        })
        successToast('Cập nhật trạng thái thành công')
        fetchOrders()
        fetchStatusCounts()
        if (selectedOrder && selectedOrder._id === pendingAction.orderId) {
          setSelectedOrder((prev) => {
            if (!prev) return null
            const updated = { ...prev, orderStatus: pendingAction.status }
            if (pendingAction.status === 'completed' && prev.paymentMethod === 'COD') {
              updated.paymentStatus = 'paid'
            }
            return updated
          })
        }
      } catch (err: any) {
        errorToast(err.message || 'Không thể cập nhật trạng thái')
      }
    } else if (pendingAction.type === 'edit') {
      await executeEditSave(headers)
    }
    setPendingAction(null)
  }

  // ── Open edit modal ──────────────────────────────────────
  const openEditModal = (order: Order) => {
    setSelectedOrder(order)
    setEditOrderStatus(order.orderStatus)
    setEditPaymentStatus(order.paymentStatus)
    setEditTrackingNumber(order.trackingNumber || '')
    setEditingStatus(true)
  }

  // ── Save full edit ───────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!selectedOrder) return    
    // Validate status transition if orderStatus changed
    if (editOrderStatus !== selectedOrder.orderStatus) {
      if (!isValidStatusTransition(selectedOrder.orderStatus, editOrderStatus)) {
        const message = getInvalidTransitionMessage(selectedOrder.orderStatus, editOrderStatus)
        errorToast(message)
        return
      }
    }
        const body: Record<string, string> = {}
    if (editOrderStatus !== selectedOrder.orderStatus) body.orderStatus = editOrderStatus
    if (editPaymentStatus !== selectedOrder.paymentStatus) body.paymentStatus = editPaymentStatus
    if (editTrackingNumber !== (selectedOrder.trackingNumber || '')) body.trackingNumber = editTrackingNumber

    if (Object.keys(body).length === 0) {
      setEditingStatus(false)
      return
    }

    setPendingAction({ type: 'edit' })
    setOtpModal(true)
  }

  const executeEditSave = async (headers: Record<string, string>) => {
    if (!selectedOrder) return
    setUpdating(true)
    try {
      const body: Record<string, string> = {}
      if (editOrderStatus !== selectedOrder.orderStatus) body.orderStatus = editOrderStatus
      if (editPaymentStatus !== selectedOrder.paymentStatus) body.paymentStatus = editPaymentStatus
      if (editTrackingNumber !== (selectedOrder.trackingNumber || '')) body.trackingNumber = editTrackingNumber

      await adminFetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers,
      })

      successToast('Cập nhật đơn hàng thành công')
      setEditingStatus(false)
      setSelectedOrder(null)
      fetchOrders()
      fetchStatusCounts()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật đơn hàng')
    } finally {
      setUpdating(false)
    }
  }

  // ── Filter by search ─────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const userName = o.user?.name?.toLowerCase() || ''
    const userPhone = o.user?.phone?.toLowerCase() || ''
    const shipPhone = o.shippingAddress?.phone?.toLowerCase() || ''
    const code = o.orderCode.toLowerCase()
    return userName.includes(q) || userPhone.includes(q) || shipPhone.includes(q) || code.includes(q)
  })

  // ── Action menu for each row ─────────────────────────────
  const getRowActions = (order: Order): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      { icon: 'visibility', label: 'Chi tiết', color: 'indigo', onClick: () => setSelectedOrder(order) },
      { icon: 'edit', label: 'Cập nhật', color: 'indigo', onClick: () => openEditModal(order) },
    ]

    if (order.orderStatus === 'pending') {
      items.push(
        { icon: 'play_arrow', label: 'Xử lý', color: 'indigo', onClick: () => handleUpdateStatus(order._id, 'processing') },
        { icon: 'close', label: 'Hủy đơn', color: 'red', onClick: () => handleUpdateStatus(order._id, 'cancelled') },
      )
    }
    if (order.orderStatus === 'processing') {
      items.push(
        { icon: 'local_shipping', label: 'Giao hàng', color: 'indigo', onClick: () => handleUpdateStatus(order._id, 'shipped') },
      )
    }
    if (order.orderStatus === 'shipped') {
      items.push(
        { icon: 'check_circle', label: 'Hoàn thành', color: 'indigo', onClick: () => handleUpdateStatus(order._id, 'completed') },
      )
    }
    return items
  }

  // ── Pagination helpers ───────────────────────────────────
  const renderPageButtons = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages.map((p, i) =>
      p === '...' ? (
        <span key={`dots-${i}`} className="px-2 text-slate-400 select-none">...</span>
      ) : (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${
            p === currentPage
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300'
          }`}
        >
          {p}
        </button>
      )
    )
  }

  // ── Reset filters ────────────────────────────────────────
  const handleReset = () => {
    setSearchQuery('')
    setActiveTab('all')
    setCurrentPage(1)
  }

  // ── Render ───────────────────────────────────────────────
  if (renderError) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-red-300 mb-4 block">error</span>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Lỗi hiển thị</h1>
            <p className="text-slate-500 mb-4">{renderError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* ── Header ───────────────────────────────────── */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <AdminBreadcrumb items={[{ label: 'Quản Lý Đơn Hàng' }]} />
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-3">Quản Lý Đơn Hàng</h1>
          <p className="text-slate-500 mt-2 max-w-lg">
            Theo dõi và quản lý các giao dịch từ khách hàng trên toàn hệ thống Voltrix Game Shop.
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('orders')}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-all ${
                viewMode === 'orders'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              Đơn Hàng
            </button>
            <button
              onClick={() => setViewMode('packingslips')}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-all ${
                viewMode === 'packingslips'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined">topic</span>
              Phiếu Đóng Gói
            </button>
          </div>
          <button
            onClick={() => {
              const csv = [
                ['Mã ĐH', 'Ngày', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Thanh toán', 'Trạng thái'].join(','),
                ...filteredOrders.map((o) =>
                  [o.orderCode, formatDate(o.createdAt), o.user?.name, o.shippingAddress?.phone, o.finalPrice, o.paymentStatus, o.orderStatus].join(',')
                ),
              ].join('\n')
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-indigo-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
          >
            <span className="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* ── Orders View ──────────────────────────────────── */}
      {viewMode === 'orders' && (
        <>
      {/* ── Status Tabs ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
            className={`p-6 bg-white rounded-xl border-l-4 ${tab.borderColor} shadow-sm flex flex-col items-start gap-1 transition-all hover:-translate-y-0.5 ${
              activeTab === tab.key ? 'ring-2 ring-indigo-200' : ''
            }`}
          >
            <span className="uppercase tracking-widest text-slate-400 text-[10px] font-bold">{tab.label}</span>
            <span className={`text-3xl font-extrabold ${tab.textColor || 'text-slate-900'}`}>
              {(statusCounts[tab.key] ?? '—').toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────── */}
      <div className="bg-white rounded-xl p-6 mb-8 flex flex-wrap items-center gap-6 shadow-sm border border-slate-100">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
              placeholder="Tìm theo tên, SĐT hoặc mã đơn..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={handleReset}
            className="px-6 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">receipt_long</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-8 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Mã Đơn Hàng</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Ngày Tạo</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Khách Hàng</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-right">Tổng Tiền</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-center">Thanh Toán</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-center">Trạng Thái</th>
                    <th className="px-8 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const os = getOrderStatus(order.orderStatus)
                    const ps = getPaymentStatus(order.paymentStatus)
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/60 transition-colors duration-200 group">
                        <td className="px-8 py-6 font-bold text-indigo-600 text-sm">{order.orderCode}</td>
                        <td className="px-6 py-6 text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900">{order.user?.name || order.shippingAddress?.name || 'Unknown'}</span>
                            <span className="text-xs text-slate-400">{order.shippingAddress?.phone || order.user?.phone || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right font-extrabold text-sm text-slate-900">{formatVND(order.finalPrice)}</td>
                        <td className="px-6 py-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${ps.bg} ${ps.color} border ${ps.border}`}>
                            {ps.dot && <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />}
                            {ps.label}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${os.bg} ${os.color} border ${os.border}`}>
                            {os.dot && <span className={`w-1.5 h-1.5 rounded-full ${os.dot}`} />}
                            {os.label}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <ActionMenu items={getRowActions(order)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ──────────────────────────── */}
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Hiển thị {(currentPage - 1) * LIMIT + 1} - {Math.min(currentPage * LIMIT, totalOrders)} trong số{' '}
                {totalOrders.toLocaleString()} đơn hàng
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {renderPageButtons()}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Order Detail / Edit Modal ────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setSelectedOrder(null); setEditingStatus(false) }}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {editingStatus ? 'Cập nhật đơn hàng' : 'Chi tiết đơn hàng'}
                </h2>
                <span className="text-sm text-indigo-600 font-bold">{selectedOrder.orderCode}</span>
              </div>
              <div className="flex items-center gap-2">
                {!editingStatus && (
                  <button
                    onClick={() => {
                      setEditOrderStatus(selectedOrder.orderStatus)
                      setEditPaymentStatus(selectedOrder.paymentStatus)
                      setEditTrackingNumber(selectedOrder.trackingNumber || '')
                      setEditingStatus(true)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Sửa
                  </button>
                )}
                <button onClick={() => { setSelectedOrder(null); setEditingStatus(false) }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* ── Edit Mode ──────────────────────────── */}
              {editingStatus ? (
                <>
                  <div className="space-y-5">
                    {/* Order Status */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Trạng thái đơn hàng</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).map((status) => {
                          const s = getOrderStatus(status)
                          const isActive = editOrderStatus === status
                          const isValid = isValidStatusTransition(selectedOrder.orderStatus, status)
                          const title = isValid ? '' : getInvalidTransitionMessage(selectedOrder.orderStatus, status)
                          
                          return (
                            <button
                              key={status}
                              title={title}
                              onClick={() => {
                                if (!isValid) return // Prevent invalid transition
                                setEditOrderStatus(status)
                                // COD: auto-set payment to paid when completed
                                if (status === 'completed' && selectedOrder.paymentMethod === 'COD') {
                                  setEditPaymentStatus('paid')
                                }
                              }}
                              disabled={!isValid}
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase border-2 transition-all ${
                                isActive
                                  ? `${s.bg} ${s.color} ${s.border} ring-2 ring-offset-1 ring-indigo-300`
                                  : isValid
                                  ? 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                                  : 'bg-slate-50 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                              }`}
                            >
                              {s.dot && <span className={`w-2 h-2 rounded-full ${isActive ? s.dot : 'bg-slate-300'}`} />}
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Validation hint */}
                      {!isValidStatusTransition(selectedOrder.orderStatus, editOrderStatus) && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 font-semibold flex items-start gap-2">
                            <span className="mt-0.5">⚠️</span>
                            <span>{getInvalidTransitionMessage(selectedOrder.orderStatus, editOrderStatus)}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment Status */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Trạng thái thanh toán</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(PAYMENT_STATUS_MAP) as PaymentStatus[]).map((status) => {
                          const s = getPaymentStatus(status)
                          const isActive = editPaymentStatus === status
                          return (
                            <button
                              key={status}
                              onClick={() => setEditPaymentStatus(status)}
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase border-2 transition-all ${
                                isActive
                                  ? `${s.bg} ${s.color} ${s.border} ring-2 ring-offset-1 ring-indigo-300`
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {s.dot && <span className={`w-2 h-2 rounded-full ${isActive ? s.dot : 'bg-slate-300'}`} />}
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Tracking Number */}
                    <div>
                      <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Mã vận chuyển</label>
                      <input
                        type="text"
                        value={editTrackingNumber}
                        onChange={(e) => setEditTrackingNumber(e.target.value)}
                        placeholder="Nhập mã vận chuyển..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                      />
                    </div>

                    {/* Change summary */}
                    {editOrderStatus !== selectedOrder.orderStatus &&
                    !isValidStatusTransition(selectedOrder.orderStatus, editOrderStatus) ? (
                      // Validation error
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h4 className="text-xs uppercase font-bold text-red-700 tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Chuyển đổi không hợp lệ
                        </h4>
                        <p className="text-xs text-red-700 whitespace-pre-wrap">
                          {getInvalidTransitionMessage(selectedOrder.orderStatus, editOrderStatus)}
                        </p>
                      </div>
                    ) : (
                      // Successful change preview
                      (editOrderStatus !== selectedOrder.orderStatus ||
                        editPaymentStatus !== selectedOrder.paymentStatus ||
                        editTrackingNumber !== (selectedOrder.trackingNumber || '')) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <h4 className="text-xs uppercase font-bold text-amber-700 tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Thay đổi sẽ áp dụng
                          </h4>
                          <ul className="space-y-1 text-sm text-amber-800">
                            {editOrderStatus !== selectedOrder.orderStatus && (
                              <li>• Trạng thái: <span className="font-bold">{getOrderStatus(selectedOrder.orderStatus).label}</span> → <span className="font-bold text-emerald-700">{getOrderStatus(editOrderStatus).label}</span></li>
                            )}
                            {editPaymentStatus !== selectedOrder.paymentStatus && (
                              <li>• Thanh toán: <span className="font-bold">{getPaymentStatus(selectedOrder.paymentStatus).label}</span> → <span className="font-bold text-emerald-700">{getPaymentStatus(editPaymentStatus).label}</span></li>
                            )}
                            {editTrackingNumber !== (selectedOrder.trackingNumber || '') && (
                              <li>• Mã vận chuyển: <span className="font-bold text-emerald-700">{editTrackingNumber || '(xóa)'}</span></li>
                            )}
                          </ul>
                        </div>
                      )
                    )}
                  </div>

                  {/* Edit actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setEditingStatus(false)}
                      className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={updating || (
                        editOrderStatus === selectedOrder.orderStatus &&
                        editPaymentStatus === selectedOrder.paymentStatus &&
                        editTrackingNumber === (selectedOrder.trackingNumber || '')
                      ) || (
                        editOrderStatus !== selectedOrder.orderStatus &&
                        !isValidStatusTransition(selectedOrder.orderStatus, editOrderStatus)
                      )}
                      title={
                        editOrderStatus !== selectedOrder.orderStatus &&
                        !isValidStatusTransition(selectedOrder.orderStatus, editOrderStatus)
                          ? 'Chuyển đổi trạng thái không hợp lệ'
                          : ''
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {updating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* ── View Mode ──────────────────────── */}
                  {/* Status row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {(() => { const os = getOrderStatus(selectedOrder.orderStatus); return (
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase ${os.bg} ${os.color} border ${os.border}`}>
                        {os.dot && <span className={`w-2 h-2 rounded-full ${os.dot}`} />} {os.label}
                      </span>
                    )})()}
                    {(() => { const ps = getPaymentStatus(selectedOrder.paymentStatus); return (
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase ${ps.bg} ${ps.color} border ${ps.border}`}>
                        {ps.dot && <span className={`w-2 h-2 rounded-full ${ps.dot}`} />} {ps.label}
                      </span>
                    )})()}
                    <span className="text-xs text-slate-400 ml-auto">{formatDate(selectedOrder.createdAt)}</span>
                  </div>

                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Khách hàng</h4>
                      <p className="font-bold text-slate-900">{selectedOrder.shippingAddress?.name || selectedOrder.user?.name}</p>
                      <p className="text-sm text-slate-500">{selectedOrder.shippingAddress?.phone}</p>
                      <p className="text-sm text-slate-500">{selectedOrder.shippingAddress?.email || selectedOrder.user?.email}</p>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Địa chỉ giao hàng</h4>
                      <p className="text-sm text-slate-700">
                        {[selectedOrder.shippingAddress?.address, selectedOrder.shippingAddress?.ward, selectedOrder.shippingAddress?.district, selectedOrder.shippingAddress?.city]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Order items */}
                  <div>
                    <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Sản phẩm ({selectedOrder.orderItems.length})</h4>
                    <div className="space-y-3">
                      {selectedOrder.orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-900 truncate">{item.name}</p>
                            {item.variant && <p className="text-xs text-slate-400">Phiên bản: {item.variant}</p>}
                            {item.warranty && <p className="text-xs text-slate-400">Bảo hành: {item.warranty}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatVND(item.priceAtPurchase)}</p>
                            <p className="text-xs text-slate-400">x{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price summary */}
                  <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Tạm tính</span>
                      <span>{formatVND(selectedOrder.totalPrice)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Giảm giá {selectedOrder.discountCode && `(${selectedOrder.discountCode})`}</span>
                        <span>-{formatVND(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Phí vận chuyển</span>
                      <span>{selectedOrder.shippingFee > 0 ? formatVND(selectedOrder.shippingFee) : 'Miễn phí'}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                      <span className="font-extrabold text-slate-900">Tổng cộng</span>
                      <span className="font-extrabold text-lg text-indigo-600">{formatVND(selectedOrder.finalPrice)}</span>
                    </div>
                  </div>

                  {/* Payment method & tracking */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-slate-400">Phương thức: </span>
                      <span className="font-bold text-slate-700">{selectedOrder.paymentMethod}</span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <span className="text-slate-400">Tracking: </span>
                        <span className="font-bold text-slate-700">{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick actions in view mode */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditOrderStatus(selectedOrder.orderStatus)
                        setEditPaymentStatus(selectedOrder.paymentStatus)
                        setEditTrackingNumber(selectedOrder.trackingNumber || '')
                        setEditingStatus(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Cập nhật trạng thái
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* ── Packing Slips View ──────────────────────── */}
      {viewMode === 'packingslips' && (
        <PackingSlipTab adminFetch={adminFetch} />
      )}

      <OTPVerificationModal
        isOpen={otpModal}
        onClose={() => { setOtpModal(false); setPendingAction(null) }}
        onVerified={handleOTPVerified}
        actionDescription={pendingAction?.type === 'edit' ? 'Cập nhật đơn hàng' : 'Thay đổi trạng thái đơn hàng'}
      />
    </AdminLayout>
  )
}

export default AdminOrders
