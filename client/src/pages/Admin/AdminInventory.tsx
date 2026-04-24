import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import OTPVerificationModal from '../../components/admin/OTPVerificationModal'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import { adminFetch } from '../../utils/adminFetch'
import { errorToast, successToast } from '../../utils/toast'

// ── Types ──────────────────────────────────────────────────
interface InventoryItem {
  _id: string
  productId: string
  variantSku: string | null
  available: number
  reserved: number
  sold: number
  damaged: number
  lastUpdated: string
  productName: string
  productImage?: { url: string; alt?: string }
  productSku: string
}

interface StockMovement {
  _id: string
  type: 'IN' | 'OUT' | 'ADJUST' | 'RESERVED' | 'UNRESERVED' | 'REFUNDED'
  quantity: number
  reason?: string
  notes?: string
  productId: { _id: string; name: string; sku?: string } | string
  variantSku?: string
  createdBy?: { _id: string; name: string; email: string }
  createdAt: string
}

interface InventoryStats {
  totalItems: number
  totalAvailable: number
  totalReserved: number
  totalSold: number
  totalDamaged: number
  outOfStock: number
  lowStock: number
}

type StatusFilter = 'all' | 'low' | 'out' | 'normal'
type TabType = 'inventory' | 'movements'

// ── Constants ──────────────────────────────────────────────
const STATUS_TABS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'Tất cả', icon: 'inventory_2' },
  { key: 'normal', label: 'Bình thường', icon: 'check_circle' },
  { key: 'low', label: 'Sắp hết', icon: 'warning' },
  { key: 'out', label: 'Hết hàng', icon: 'error' },
]

const MOVEMENT_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  IN: { label: 'Nhập kho', color: 'text-emerald-600', icon: 'add_circle' },
  OUT: { label: 'Xuất kho', color: 'text-red-600', icon: 'remove_circle' },
  ADJUST: { label: 'Điều chỉnh', color: 'text-amber-600', icon: 'tune' },
  RESERVED: { label: 'Giữ hàng', color: 'text-blue-600', icon: 'lock' },
  UNRESERVED: { label: 'Hủy giữ', color: 'text-slate-600', icon: 'lock_open' },
  REFUNDED: { label: 'Hoàn kho', color: 'text-purple-600', icon: 'undo' },
}

const LIMIT = 10

// ── Helpers ────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

const getStockBadge = (available: number) => {
  if (available === 0)
    return { label: 'Hết hàng', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
  if (available <= 5)
    return { label: 'Sắp hết', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
  return { label: 'Còn hàng', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
}

// ── Component ──────────────────────────────────────────────
const AdminInventory: React.FC = () => {
  // Tab
  const [activeTab, setActiveTab] = useState<TabType>('inventory')

  // Inventory data
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({ totalItems: 0, totalAvailable: 0, totalReserved: 0, totalSold: 0, totalDamaged: 0, outOfStock: 0, lowStock: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Movements data
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [movementType, setMovementType] = useState('all')
  const [movementsPage, setMovementsPage] = useState(1)
  const [movementsTotalPages, setMovementsTotalPages] = useState(1)

  // Edit modal
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({ available: 0, reserved: 0, damaged: 0, reason: '' })
  const [saving, setSaving] = useState(false)

  // OTP modal
  const [otpModal, setOtpModal] = useState(false)
  const [pendingOtpToken, setPendingOtpToken] = useState<string | null>(null)

  // ── Search debounce ──────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Fetch inventory ──────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(LIMIT))
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const { data, error } = await adminFetch<{
        success: boolean
        data:{
        items: InventoryItem[]
        pagination: { page: number; total: number; pages: number }
        }
      }>(`/api/inventory/admin/all?${params}`)

      if (error) throw error
      setItems(data?.data?.items || [])
      setTotalPages(data?.data?.pagination.pages || 1)
      setTotalItems(data?.data?.pagination.total || 0)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải dữ liệu kho')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, searchQuery])

  // ── Fetch stats ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const { data: fullResponse, error } = await adminFetch<any>('/api/inventory/admin/stats')
      if (!error && fullResponse) {
        const statsData = fullResponse?.data || fullResponse
        setStats(statsData)
      }
    } catch { /* silent */ }
  }, [])

  // ── Fetch movements ──────────────────────────────────────
  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(movementsPage))
      params.set('limit', '20')
      if (movementType !== 'all') params.set('type', movementType)

      const { data: fullResponse, error } = await adminFetch<any>(`/api/inventory/admin/movements?${params}`)

      if (error) throw error
      const data = fullResponse?.data || fullResponse
      setMovements(data?.movements || [])
      setMovementsTotalPages(data?.pagination?.pages || 1)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải lịch sử')
    } finally {
      setMovementsLoading(false)
    }
  }, [movementsPage, movementType])

  useEffect(() => { fetchInventory() }, [fetchInventory])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { if (activeTab === 'movements') fetchMovements() }, [activeTab, fetchMovements])

  // ── OTP flow for update ──────────────────────────────────
  const handleSaveClick = () => {
    if (!editItem) return
    setOtpModal(true)
  }

  const handleOTPVerified = (otpToken: string) => {
    setOtpModal(false)
    setPendingOtpToken(otpToken)
  }

  useEffect(() => {
    if (pendingOtpToken !== null) {
      executeUpdate(pendingOtpToken)
      setPendingOtpToken(null)
    }
  }, [pendingOtpToken])

  const executeUpdate = async (otpToken: string) => {
    if (!editItem) return
    setSaving(true)
    try {
      const sku = editItem.variantSku || 'null'
      const { error } = await adminFetch(`/api/inventory/${editItem.productId}/${sku}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
        headers: otpToken ? { otpToken } : undefined,
      })

      if (error) throw error
      successToast('Cập nhật tồn kho thành công')
      setEditItem(null)
      fetchInventory()
      fetchStats()
      if (activeTab === 'movements') fetchMovements()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật')
    } finally {
      setSaving(false)
    }
  }

  // ── Row actions ──────────────────────────────────────────
  const getRowActions = (item: InventoryItem): ActionMenuItem[] => [
    {
      icon: 'edit',
      label: 'Điều chỉnh tồn kho',
      color: 'indigo',
      onClick: () => {
        setEditItem(item)
        setEditForm({
          available: item.available,
          reserved: item.reserved,
          damaged: item.damaged,
          reason: '',
        })
      },
    },
  ]

  // ── Pagination ───────────────────────────────────────────
  const renderPageButtons = (page: number, total: number, setPage: (p: number) => void) => {
    const pages: (number | '...')[] = []
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(total - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < total - 2) pages.push('...')
      pages.push(total)
    }
    return pages.map((p, i) =>
      p === '...' ? (
        <span key={`dots-${i}`} className="px-2 text-slate-400 select-none">...</span>
      ) : (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${
            p === page
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300'
          }`}
        >
          {p}
        </button>
      )
    )
  }

  return (
    <AdminLayout>
      {/* ── Header ───────────────────────────────────── */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <AdminBreadcrumb items={[{ label: 'Quản Lý Kho Hàng' }]} />
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-3">Quản Lý Kho Hàng</h1>
          <p className="text-slate-500 mt-2 max-w-lg">
            Theo dõi tồn kho, nhập xuất và điều chỉnh số lượng sản phẩm.
          </p>
        </div>
        {/* Tab switches */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          {[
            { key: 'inventory' as TabType, label: 'Tồn Kho', icon: 'warehouse' },
            { key: 'movements' as TabType, label: 'Lịch Sử', icon: 'history' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng SKU', value: stats.totalItems, icon: 'inventory_2', textColor: 'text-slate-900', borderColor: 'border-indigo-500' },
          { label: 'Có sẵn bán', value: stats.totalAvailable, icon: 'check_circle', textColor: 'text-emerald-600', borderColor: 'border-emerald-400' },
          { label: 'Sắp hết hàng', value: stats.lowStock, icon: 'warning', textColor: 'text-amber-600', borderColor: 'border-amber-400', alert: stats.lowStock > 0 },
          { label: 'Hết hàng', value: stats.outOfStock, icon: 'error', textColor: 'text-red-600', borderColor: 'border-red-400', alert: stats.outOfStock > 0 },
        ].map((card) => (
          <div key={card.label} className={`p-6 bg-white rounded-xl border-l-4 ${card.borderColor} shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5`}>
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-slate-100 opacity-30">{card.icon}</span>
            <span className="uppercase tracking-widest text-slate-400 text-[10px] font-bold">{card.label}</span>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-extrabold ${card.textColor}`}>{Number(card.value ?? 0).toLocaleString()}</span>
              {card.alert && (
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> CẦN XỬ LÝ
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Inventory Tab ────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl p-6 flex flex-wrap items-center gap-6 shadow-sm border border-slate-100">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm sản phẩm, SKU..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setStatusFilter(tab.key); setCurrentPage(1) }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    statusFilter === tab.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2">inventory_2</span>
                <p className="font-bold">Không tìm thấy sản phẩm</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sản Phẩm</th>
                      <th className="text-center px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-emerald-600 uppercase tracking-wider">Có sẵn</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-blue-600 uppercase tracking-wider">Đang giữ</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đã bán</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-red-500 uppercase tracking-wider">Hỏng</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cập nhật</th>
                      <th className="text-center px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => {
                      const badge = getStockBadge(item.available)
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Product */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                {item.productImage?.url ? (
                                  <img src={item.productImage.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate max-w-[220px]">{item.productName}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  {item.variantSku || item.productSku || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>
                          {/* Available */}
                          <td className="px-4 py-4 text-right">
                            <span className={`text-sm font-extrabold ${item.available === 0 ? 'text-red-600' : item.available <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {item.available.toLocaleString()}
                            </span>
                          </td>
                          {/* Reserved */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-blue-600">{item.reserved.toLocaleString()}</span>
                          </td>
                          {/* Sold */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-slate-600">{item.sold.toLocaleString()}</span>
                          </td>
                          {/* Damaged */}
                          <td className="px-4 py-4 text-right">
                            <span className={`text-sm font-bold ${item.damaged > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                              {item.damaged.toLocaleString()}
                            </span>
                          </td>
                          {/* Last updated */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs text-slate-400">{timeAgo(item.lastUpdated)}</span>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-4 text-center">
                            <ActionMenu items={getRowActions(item)} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Hiển thị <span className="font-bold text-slate-700">{(currentPage - 1) * LIMIT + 1}-{Math.min(currentPage * LIMIT, totalItems)}</span> / <span className="font-bold">{totalItems}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {renderPageButtons(currentPage, totalPages, setCurrentPage)}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Movements Tab ────────────────────────────── */}
      {activeTab === 'movements' && (
        <div className="space-y-6">
          {/* Type filter */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => { setMovementType('all'); setMovementsPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  movementType === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tất cả
              </button>
              {Object.entries(MOVEMENT_TYPES).map(([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => { setMovementType(key); setMovementsPage(1) }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    movementType === key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Movements list */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {movementsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2">history</span>
                <p className="font-bold">Chưa có lịch sử nhập xuất</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {movements.map((mv) => {
                  const typeInfo = MOVEMENT_TYPES[mv.type] || { label: mv.type, color: 'text-slate-600', icon: 'help' }
                  const productName = typeof mv.productId === 'object' ? mv.productId.name : '—'
                  return (
                    <div key={mv._id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          mv.type === 'IN' ? 'bg-emerald-50' :
                          mv.type === 'OUT' ? 'bg-red-50' :
                          'bg-slate-100'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${typeInfo.color}`}>{typeInfo.icon}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-extrabold uppercase ${typeInfo.color}`}>{typeInfo.label}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-sm font-bold text-slate-800 truncate">{productName}</span>
                            {mv.variantSku && (
                              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{mv.variantSku}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {mv.reason || mv.notes || '—'}
                            {mv.createdBy && typeof mv.createdBy === 'object' && (
                              <> • bởi <span className="font-semibold">{mv.createdBy.name}</span></>
                            )}
                          </p>
                        </div>

                        {/* Quantity */}
                        <div className="text-right">
                          <span className={`text-lg font-extrabold ${
                            mv.type === 'IN' || mv.type === 'UNRESERVED' || mv.type === 'REFUNDED'
                              ? 'text-emerald-600'
                              : mv.type === 'OUT' || mv.type === 'RESERVED'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }`}>
                            {mv.type === 'IN' || mv.type === 'UNRESERVED' || mv.type === 'REFUNDED' ? '+' : '-'}{mv.quantity}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs text-slate-400">{formatDate(mv.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {movementsTotalPages > 1 && (
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                  disabled={movementsPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {renderPageButtons(movementsPage, movementsTotalPages, setMovementsPage)}
                <button
                  onClick={() => setMovementsPage((p) => Math.min(movementsTotalPages, p + 1))}
                  disabled={movementsPage === movementsTotalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Inventory Modal ─────────────────────── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditItem(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Điều Chỉnh Tồn Kho</h2>
                <p className="text-sm text-slate-500 mt-1">{editItem.productName}</p>
                {editItem.variantSku && (
                  <p className="text-xs font-mono text-slate-400 mt-0.5">SKU: {editItem.variantSku}</p>
                )}
              </div>
              <button onClick={() => setEditItem(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-5">
              {/* Current stock overview */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Có sẵn', value: editItem.available, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Đang giữ', value: editItem.reserved, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Đã bán', value: editItem.sold, color: 'text-slate-600', bg: 'bg-slate-50' },
                  { label: 'Hỏng', value: editItem.damaged, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2 text-center`}>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{s.label}</p>
                    <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <hr className="border-slate-100" />

              {/* Edit fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">check_circle</span>
                    Có sẵn
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.available}
                    onChange={(e) => setEditForm((f) => ({ ...f, available: Math.max(0, Number(e.target.value)) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">lock</span>
                    Đang giữ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.reserved}
                    onChange={(e) => setEditForm((f) => ({ ...f, reserved: Math.max(0, Number(e.target.value)) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">broken_image</span>
                    Hỏng
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.damaged}
                    onChange={(e) => setEditForm((f) => ({ ...f, damaged: Math.max(0, Number(e.target.value)) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Diff indicator */}
              {editForm.available !== editItem.available && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${
                  editForm.available > editItem.available
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className="material-symbols-outlined text-lg">
                    {editForm.available > editItem.available ? 'trending_up' : 'trending_down'}
                  </span>
                  Thay đổi: {editForm.available > editItem.available ? '+' : ''}{editForm.available - editItem.available} đơn vị
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Nhập lý do (VD: Nhập hàng mới, Kiểm kê, ...)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditItem(null)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveClick}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
              >
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span className="material-symbols-outlined text-base">save</span>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OTP Modal ────────────────────────────────── */}
      <OTPVerificationModal
        isOpen={otpModal}
        onClose={() => setOtpModal(false)}
        onVerified={handleOTPVerified}
        actionDescription="Điều chỉnh tồn kho"
      />
    </AdminLayout>
  )
}

export default AdminInventory
