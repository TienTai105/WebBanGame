import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal'
import OTPVerificationModal from '../../components/admin/OTPVerificationModal'
import PromotionModal from '../../components/admin/PromotionModal'
import { errorToast, successToast } from '../../utils/toast'
import { adminFetch } from '../../utils/adminFetch'

// ── Types ──────────────────────────────────────────────────
interface Promotion {
  _id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxDiscount?: number
  minOrderValue?: number
  usageLimit: number
  usedCount: number
  usagePerUser?: number
  badge?: string
  startDate: string
  endDate: string
  isActive: boolean
  description?: string
  conditions?: string[]
  computedStatus: 'active' | 'expired' | 'scheduled'
  createdAt: string
  updatedAt: string
}

interface Stats {
  activeCount: number
  totalRedemptions: number
  total: number
}

// ── Constants ──────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',    color: 'text-emerald-600', dot: 'bg-emerald-500' },
  expired:   { label: 'Expired',   color: 'text-slate-500',   dot: 'bg-slate-400' },
  scheduled: { label: 'Scheduled', color: 'text-amber-600',   dot: 'bg-amber-500' },
}

const TYPE_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'percentage', label: 'Phần trăm' },
  { key: 'fixed', label: 'Số tiền cố định' },
]

// ── Helpers ────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })

const formatValue = (type: string, value: number) =>
  type === 'percentage' ? `${value}%` : `${value.toLocaleString('vi-VN')}₫`

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

// ── Component ──────────────────────────────────────────────
const AdminPromotions: React.FC = () => {
  // Data
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [stats, setStats] = useState<Stats>({ activeCount: 0, totalRedemptions: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const LIMIT = 6

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Promotion modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [modalPromotion, setModalPromotion] = useState<Promotion | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ── Fetch promotions ───────────────────────────────────
  const fetchPromotions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(LIMIT),
        sort: 'newest',
      })
      if (searchQuery) params.set('search', searchQuery)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const { data: json, error } = await adminFetch(`/api/promotions/admin/all?${params}`)
      if (error) throw error
      setPromotions(json.data || [])
      setStats(json.stats || { activeCount: 0, totalRedemptions: 0, total: 0 })
      setTotalPages(json.pagination?.totalPages || 1)
      setTotalItems(json.pagination?.total || 0)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải danh sách khuyến mãi')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter, adminFetch])

  useEffect(() => { fetchPromotions() }, [fetchPromotions])

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, typeFilter, statusFilter])

  // ── Search debounce ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const [otpModal, setOtpModal] = useState(false)

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setOtpModal(true)
  }

  const handleDeleteOTPVerified = async (otpToken: string) => {
    setOtpModal(false)
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await adminFetch(`/api/promotions/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: otpToken ? { otpToken } : {},
      })
      successToast('Đã xóa khuyến mãi')
      setDeleteTarget(null)
      fetchPromotions()
    } catch (err: any) {
      errorToast(err.message || 'Không thể xóa')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Open modal ─────────────────────────────────────────
  const openCreateModal = () => {
    setModalPromotion(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const openViewModal = async (promo: Promotion) => {
    setLoadingDetail(true)
    try {
      const { data: json, error } = await adminFetch(`/api/promotions/admin/${promo._id}`)
      if (error) throw error
      setModalPromotion(json.data)
      setModalMode('view')
      setModalOpen(true)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải chi tiết')
    } finally {
      setLoadingDetail(false)
    }
  }

  const openEditModal = async (promo: Promotion) => {
    setLoadingDetail(true)
    try {
      const { data: json, error } = await adminFetch(`/api/promotions/admin/${promo._id}`)
      if (error) throw error
      setModalPromotion(json.data)
      setModalMode('edit')
      setModalOpen(true)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải chi tiết')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleModalSave = async (data: any) => {
    if (modalMode === 'create') {
      await adminFetch('/api/promotions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      successToast('Đã tạo khuyến mãi mới')
    } else if (modalMode === 'edit' && modalPromotion) {
      await adminFetch(`/api/promotions/${modalPromotion._id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      successToast('Đã cập nhật khuyến mãi')
    }
    setModalOpen(false)
    fetchPromotions()
  }

  // ── Toggle active ──────────────────────────────────────
  const handleToggleActive = async (promo: Promotion) => {
    try {
      await adminFetch(`/api/promotions/${promo._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !promo.isActive }),
      })
      successToast(promo.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt')
      fetchPromotions()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật')
    }
  }

  // ── Action menu builder ────────────────────────────────
  const buildActions = (promo: Promotion): ActionMenuItem[] => [
    { icon: 'visibility', label: 'Xem chi tiết', onClick: () => openViewModal(promo) },
    { icon: 'edit', label: 'Chỉnh sửa', color: 'indigo', onClick: () => openEditModal(promo) },
    {
      icon: promo.isActive ? 'pause_circle' : 'play_circle',
      label: promo.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
      onClick: () => handleToggleActive(promo),
    },
    { icon: 'delete', label: 'Xóa', color: 'red', onClick: () => setDeleteTarget(promo) },
  ]

  // ── Usage bar ──────────────────────────────────────────
  const UsageBar = ({ used, limit }: { used: number; limit: number }) => {
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
    const isFull = pct >= 100
    return (
      <div className="w-full max-w-[120px] mx-auto">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>{used.toLocaleString()}</span>
          <span>{limit.toLocaleString()}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-slate-400' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Pagination ─────────────────────────────────────────
  const PaginationBar = () => {
    if (totalPages <= 1) return null
    const pages: (number | string)[] = []
    const maxVisible = 3
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, currentPage + half)
    if (currentPage <= half) end = Math.min(totalPages, maxVisible)
    if (currentPage > totalPages - half) start = Math.max(1, totalPages - maxVisible + 1)
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...') }
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages) }

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={i} className="px-2 text-slate-400 text-xs font-bold">...</span>
          ) : (
            <button
              key={i}
              onClick={() => setCurrentPage(p as number)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                currentPage === p
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    )
  }

  // ── Skeleton row ───────────────────────────────────────
  const SkeletonRow = () => (
    <tr className="bg-white">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-md animate-pulse w-3/4" /></td>
      ))}
    </tr>
  )

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto space-y-8">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <AdminBreadcrumb items={[{ label: 'Khuyến Mãi' }]} />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">Quản lý Khuyến Mãi</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý mã giảm giá và chiến dịch khuyến mãi</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Tạo Khuyến Mãi
          </button>
        </div>

        {/* ── KPI Cards ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Mã Đang Hoạt Động</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-extrabold text-indigo-600">{stats.activeCount}</span>
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                /{stats.total} tổng
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Tổng Lượt Sử Dụng</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-extrabold text-slate-900">{formatNumber(stats.totalRedemptions)}</span>
              <span className="material-symbols-outlined text-indigo-500 text-xl">trending_up</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Tổng Khuyến Mãi</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-extrabold text-slate-900">{stats.total}</span>
              <span className="material-symbols-outlined text-indigo-500 text-xl">confirmation_number</span>
            </div>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Type tabs */}
          <div className="bg-slate-100 p-1 rounded-lg flex gap-0.5">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  typeFilter === tab.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm mã..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all w-44"
              />
            </div>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-sm px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all text-slate-600 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* ── Data Table ───────────────────────────────── */}
        <div className="overflow-hidden">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Mã</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Loại</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Giá trị</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-center">Sử dụng</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Ngày hết hạn</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold">Trạng thái</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">sell</span>
                    <p className="text-slate-500 font-semibold">Không tìm thấy khuyến mãi nào</p>
                    <p className="text-slate-400 text-sm mt-1">Thay đổi bộ lọc hoặc tạo khuyến mãi mới</p>
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => {
                  const statusInfo = STATUS_MAP[promo.computedStatus] || STATUS_MAP.expired
                  const isExpired = promo.computedStatus === 'expired'

                  return (
                    <tr
                      key={promo._id}
                      className="group bg-white hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => openViewModal(promo)}
                    >
                      <td className="px-6 py-5 rounded-l-xl">
                        <span className={`font-mono font-bold tracking-wider bg-slate-50 px-3 py-1.5 rounded text-sm ${isExpired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {promo.code}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-500">
                          {promo.type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-bold text-lg ${promo.type === 'percentage' && promo.value >= 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {formatValue(promo.type, promo.value)}
                        </span>
                      </td>
                      <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                        <UsageBar used={promo.usedCount} limit={promo.usageLimit} />
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-500">{formatDate(promo.endDate)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                          <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right rounded-r-xl" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu items={buildActions(promo)} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        {!loading && promotions.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-400">
              Hiển thị <span className="font-semibold text-slate-700">{promotions.length}</span> / <span className="font-semibold text-slate-700">{totalItems}</span> khuyến mãi
            </p>
            <PaginationBar />
          </div>
        )}
      </div>

      {/* Delete modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        productName={deleteTarget?.code || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />

      <OTPVerificationModal
        isOpen={otpModal}
        onClose={() => setOtpModal(false)}
        onVerified={handleDeleteOTPVerified}
        actionDescription="Xóa khuyến mãi"
      />

      {/* Promotion modal (create/edit/view) */}
      <PromotionModal
        isOpen={modalOpen}
        mode={modalMode}
        promotion={modalPromotion}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
      />

      {/* Loading overlay for detail fetch */}
      {loadingDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminPromotions
