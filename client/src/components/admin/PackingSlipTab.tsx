import React, { useState, useEffect, useCallback } from 'react'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import { errorToast, successToast } from '../../utils/toast'

interface PackingSlipItem {
  productId: string
  name: string
  quantity: number
  variantSku?: string
  variant?: string
  itemNotes?: string
}

interface PackingSlipNote {
  itemId?: string
  note: string
}

interface PackingSlip {
  _id: string
  orderId: string
  orderCode: string
  items: PackingSlipItem[]
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    ward?: string
    district?: string
  }
  generalNotes?: string
  itemNotes?: PackingSlipNote[]
  totalPrice: number
  finalPrice: number
  status: 'not_printed' | 'printed' | 'packing' | 'completed'
  printedAt?: string
  packingStartedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface PackingSlipTabProps {
  adminFetch: (url: string, options?: RequestInit) => Promise<any>
}

const STATUS_MAP: Record<PackingSlip['status'], { label: string; color: string; bg: string; border: string; dot?: string }> = {
  not_printed: { label: 'Chưa In', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
  printed: { label: 'Đã In', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  packing: { label: 'Đang Pack', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  completed: { label: 'Hoàn Thành', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
}

type StatusTab = 'all' | PackingSlip['status']

const PackingSlipTab: React.FC<PackingSlipTabProps> = ({ adminFetch }) => {
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSlips, setTotalSlips] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [selectedSlip, setSelectedSlip] = useState<PackingSlip | null>(null)
  const [editingSlip, setEditingSlip] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [editItemNotes, setEditItemNotes] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState(false)
  const [printSlip, setPrintSlip] = useState<PackingSlip | null>(null)

  const LIMIT = 10
  const STATUS_TABS: { key: StatusTab; label: string; borderColor: string; textColor: string }[] = [
    { key: 'all', label: 'Tất Cả', borderColor: 'border-indigo-500', textColor: '' },
    { key: 'not_printed', label: 'Chưa In', borderColor: 'border-slate-400', textColor: 'text-slate-600' },
    { key: 'printed', label: 'Đã In', borderColor: 'border-blue-400', textColor: 'text-blue-600' },
    { key: 'packing', label: 'Đang Pack', borderColor: 'border-amber-400', textColor: 'text-amber-600' },
    { key: 'completed', label: 'Hoàn Thành', borderColor: 'border-emerald-400', textColor: 'text-emerald-600' },
  ]

  // Fetch packing slips
  const fetchPackingSlips = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('skip', String((currentPage - 1) * LIMIT))
      params.set('limit', String(LIMIT))
      if (activeTab !== 'all') params.set('status', activeTab)

      const json = await adminFetch(`/api/packingslips?${params}`)
      setPackingSlips(json.data || [])
      setTotalSlips(json.total || 0)
      setTotalPages(json.pages || 1)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải danh sách phiếu đóng gói')
    } finally {
      setLoading(false)
    }
  }, [currentPage, activeTab, adminFetch])

  // Fetch status counts
  const fetchStatusCounts = useCallback(async () => {
    try {
      const statuses: StatusTab[] = ['all', 'not_printed', 'printed', 'packing', 'completed']
      const counts: Record<string, number> = {}

      const promises = statuses.map(async (status) => {
        const url = status === 'all'
          ? '/api/packingslips?limit=1'
          : `/api/packingslips?limit=1&status=${status}`
        try {
          const json = await adminFetch(url)
          counts[status] = json.total ?? 0
        } catch {}
      })
      await Promise.all(promises)
      setStatusCounts(counts)
    } catch {}
  }, [adminFetch])

  useEffect(() => {
    fetchPackingSlips()
  }, [fetchPackingSlips])

  useEffect(() => {
    fetchStatusCounts()
  }, [fetchStatusCounts])

  // Filter search
  const filteredSlips = packingSlips.filter((slip) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      slip.orderCode.toLowerCase().includes(q) ||
      slip.shippingAddress.name.toLowerCase().includes(q) ||
      slip.shippingAddress.phone.toLowerCase().includes(q)
    )
  })

  // Handle print
  const handlePrint = (slip: PackingSlip) => {
    setPrintSlip(slip)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  // Handle edit
  const openEditModal = (slip: PackingSlip) => {
    setSelectedSlip(slip)
    setEditNotes(slip.generalNotes || '')
    const notes: Record<string, string> = {}
    slip.items.forEach((item) => {
      const itemKey = item.variantSku || item.productId
      const itemNote = slip.itemNotes?.find(
        (note) => note.itemId === itemKey
      )
      if (itemNote) notes[itemKey] = itemNote.note
    })
    setEditItemNotes(notes)
    setEditingSlip(true)
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedSlip) return
    setUpdating(true)
    try {
      const itemNotes: PackingSlipNote[] = Object.entries(editItemNotes)
        .filter(([_, note]) => note.trim())
        .map(([itemId, note]) => ({ itemId, note }))

      await adminFetch(`/api/packingslips/${selectedSlip._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          generalNotes: editNotes,
          itemNotes,
        }),
      })

      successToast('Cập nhật phiếu thành công')
      setEditingSlip(false)
      setSelectedSlip(null)
      fetchPackingSlips()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật phiếu')
    } finally {
      setUpdating(false)
    }
  }

  // Update status
  const updateStatus = async (slipId: string, newStatus: PackingSlip['status']) => {
    try {
      const statusEndpoints: Record<PackingSlip['status'], string | null> = {
        printed: 'print',
        packing: 'packing',
        completed: 'complete',
        not_printed: null,
      }

      const endpoint = statusEndpoints[newStatus]
      if (!endpoint) {
        errorToast('Không thể cập nhật trạng thái này')
        return
      }

      await adminFetch(`/api/packingslips/${slipId}/${endpoint}`, {
        method: 'PUT',
      })

      successToast('Cập nhật trạng thái thành công')
      fetchPackingSlips()
      fetchStatusCounts()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật trạng thái')
    }
  }

  // Row actions
  const getRowActions = (slip: PackingSlip): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      { icon: 'visibility', label: 'Chi tiết', color: 'indigo', onClick: () => setSelectedSlip(slip) },
      { icon: 'print', label: 'In phiếu', color: 'indigo', onClick: () => handlePrint(slip) },
      { icon: 'edit', label: 'Sửa', color: 'indigo', onClick: () => openEditModal(slip) },
    ]

    if (slip.status === 'not_printed') {
      items.push({ icon: 'check', label: 'Đã in', color: 'indigo', onClick: () => updateStatus(slip._id, 'printed') })
    }
    if (slip.status === 'printed') {
      items.push({ icon: 'work', label: 'Đang pack', color: 'indigo', onClick: () => updateStatus(slip._id, 'packing') })
    }
    if (slip.status === 'packing') {
      items.push({ icon: 'done', label: 'Hoàn thành', color: 'indigo', onClick: () => updateStatus(slip._id, 'completed') })
    }

    return items
  }

  // Pagination
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

  return (
    <div className="space-y-8">
      {/* Status Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setCurrentPage(1)
            }}
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            placeholder="Tìm theo mã đơn, tên khách hàng..."
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">receipt</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy phiếu đóng gói</h3>
            <p className="text-slate-500">Chất lượng hiện tại không có phiếu đóng gói.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-8 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Mã Đơn</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Ngày Tạo</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Người Nhận</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">SĐT</th>
                    <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-center">Trạng Thái</th>
                    <th className="px-8 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSlips.map((slip) => {
                    const s = STATUS_MAP[slip.status]
                    return (
                      <tr key={slip._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-8 py-6 font-bold text-indigo-600 text-sm">{slip.orderCode}</td>
                        <td className="px-6 py-6 text-sm text-slate-500">
                          {new Date(slip.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-6 text-sm font-medium text-slate-900">{slip.shippingAddress.name}</td>
                        <td className="px-6 py-6 text-sm text-slate-600">{slip.shippingAddress.phone}</td>
                        <td className="px-6 py-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${s.bg} ${s.color} border ${s.border}`}>
                            {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
                            {s.label}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <ActionMenu items={getRowActions(slip)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Hiển thị {(currentPage - 1) * LIMIT + 1} - {Math.min(currentPage * LIMIT, totalSlips)} trong số{' '}
                {totalSlips.toLocaleString()} phiếu
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

      {/* Print Preview */}
      {printSlip && (
        <div className="print-slip fixed inset-0 z-50 overflow-y-auto bg-white print:bg-white">
          <div className="flex items-center justify-between sticky top-0 z-10 bg-white border-b border-slate-200 p-4 print:hidden">
            <h2 className="text-xl font-bold text-slate-900">In phiếu đóng gói - {printSlip.orderCode}</h2>
            <button
              onClick={() => setPrintSlip(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
          
          <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">PHIẾU ĐÓNG GÓI</h1>
              <div className="text-xl text-indigo-600 font-bold">{printSlip.orderCode}</div>
              <div className="text-sm text-slate-500 mt-2">
                {new Date(printSlip.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Status Badge */}
            <div className="text-center mb-8">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-extrabold uppercase ${
                  STATUS_MAP[printSlip.status].bg
                } ${STATUS_MAP[printSlip.status].color} border ${STATUS_MAP[printSlip.status].border}`}
              >
                {STATUS_MAP[printSlip.status].dot && (
                  <span className={`w-2 h-2 rounded-full ${STATUS_MAP[printSlip.status].dot}`} />
                )}
                {STATUS_MAP[printSlip.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Shipping Address */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">Địa chỉ giao hàng</h3>
                <div className="border-2 border-slate-300 rounded-lg p-6 print:border print:border-slate-400">
                  <div className="font-extrabold text-lg text-slate-900 mb-1">{printSlip.shippingAddress.name}</div>
                  <div className="text-sm text-slate-600 mb-2">{printSlip.shippingAddress.phone}</div>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <div>{printSlip.shippingAddress.address}</div>
                    {printSlip.shippingAddress.ward && <div>{printSlip.shippingAddress.ward}</div>}
                    {printSlip.shippingAddress.district && <div>{printSlip.shippingAddress.district}</div>}
                    <div className="font-medium">{printSlip.shippingAddress.city}</div>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-2">Tổng số lượng</label>
                  <div className="text-3xl font-extrabold text-indigo-600">{printSlip.items.reduce((sum, it) => sum + it.quantity, 0)}</div>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-2">Số SKU</label>
                  <div className="text-2xl font-bold text-slate-900">{printSlip.items.length}</div>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-2">Giá tổng</label>
                  <div className="text-2xl font-bold text-emerald-600">{printSlip.totalPrice.toLocaleString('vi-VN')}đ</div>
                </div>
                {printSlip.finalPrice !== printSlip.totalPrice && (
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-2">Giá cuối (sau khuyến mãi)</label>
                    <div className="text-2xl font-bold text-orange-600">{printSlip.finalPrice.toLocaleString('vi-VN')}đ</div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">Danh sách hàng hóa</h3>
              <table className="w-full border-collapse border-2 border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-3 text-left font-bold text-sm text-slate-900">Sản phẩm</th>
                    <th className="border border-slate-300 px-4 py-3 text-center font-bold text-sm text-slate-900 w-24">SL</th>
                    <th className="border border-slate-300 px-4 py-3 text-left font-bold text-sm text-slate-900">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {printSlip.items.map((item, i) => {
                    const itemKey = item.variantSku || item.productId
                    const itemNote = printSlip.itemNotes?.find((note) => note.itemId === itemKey)
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-4 py-3 text-sm">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.variantSku && <div className="text-xs text-slate-500">SKU: {item.variantSku}</div>}
                          {item.variant && <div className="text-xs text-slate-500">{item.variant}</div>}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-bold text-slate-900">
                          x{item.quantity}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-sm text-slate-700">
                          {itemNote?.note || ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* General Notes */}
            {printSlip.generalNotes && (
              <div className="mb-8 border-2 border-amber-300 bg-amber-50 p-4 rounded-lg">
                <h3 className="text-xs uppercase font-bold text-amber-900 tracking-wider mb-2">Ghi chú chung</h3>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{printSlip.generalNotes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-slate-300 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-xs uppercase text-slate-500 font-bold mb-12 mt-2">Người đóng gói</div>
                <div className="h-1 border-t border-slate-400"></div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-500 font-bold mb-12 mt-2">Người kiểm tra</div>
                <div className="h-1 border-t border-slate-400"></div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-500 font-bold mb-12 mt-2">Ngày in</div>
                <div className="font-bold text-sm text-slate-900">
                  {new Date().toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSlip && !editingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedSlip(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Chi tiết phiếu đóng gói</h2>
                <span className="text-sm text-indigo-600 font-bold">{selectedSlip.orderCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedSlip)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Sửa
                </button>
                <button
                  onClick={() => handlePrint(selectedSlip)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  In
                </button>
                <button onClick={() => setSelectedSlip(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Shipping Address */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Địa chỉ giao hàng</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-1 border border-slate-200">
                  <div className="font-bold text-slate-900">{selectedSlip.shippingAddress.name}</div>
                  <div className="text-sm text-slate-600">{selectedSlip.shippingAddress.phone}</div>
                  <div className="text-sm text-slate-600">
                    {selectedSlip.shippingAddress.address}
                    {selectedSlip.shippingAddress.ward && `, ${selectedSlip.shippingAddress.ward}`}
                    {selectedSlip.shippingAddress.district && `, ${selectedSlip.shippingAddress.district}`}
                  </div>
                  <div className="text-sm text-slate-600">{selectedSlip.shippingAddress.city}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Danh sách hàng</h3>
                <div className="space-y-2">
                  {selectedSlip.items.map((item, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.variant && <div className="text-xs text-slate-500">{item.variant}</div>}
                        {item.variantSku && <div className="text-xs text-slate-500">SKU: {item.variantSku}</div>}
                        {item.itemNotes && <div className="text-xs text-amber-600 mt-1">📝 {item.itemNotes}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">x{item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedSlip.generalNotes && (
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Ghi chú chung</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                    {selectedSlip.generalNotes}
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Trạng thái</label>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${STATUS_MAP[selectedSlip.status].bg} ${STATUS_MAP[selectedSlip.status].color} border ${STATUS_MAP[selectedSlip.status].border}`}>
                    {STATUS_MAP[selectedSlip.status].dot && <span className={`w-2 h-2 rounded-full ${STATUS_MAP[selectedSlip.status].dot}`} />}
                    {STATUS_MAP[selectedSlip.status].label}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Ngày tạo</label>
                  <div className="text-sm text-slate-900 font-medium">
                    {new Date(selectedSlip.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Giá tổng</label>
                  <div className="text-sm text-emerald-600 font-bold">{selectedSlip.totalPrice.toLocaleString('vi-VN')}đ</div>
                </div>
                {selectedSlip.finalPrice !== selectedSlip.totalPrice && (
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Giá cuối (sau KM)</label>
                    <div className="text-sm text-orange-600 font-bold">{selectedSlip.finalPrice.toLocaleString('vi-VN')}đ</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedSlip && editingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditingSlip(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Sửa phiếu đóng gói</h2>
                <span className="text-sm text-indigo-600 font-bold">{selectedSlip.orderCode}</span>
              </div>
              <button onClick={() => setEditingSlip(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              {/* General Notes */}
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Ghi chú chung</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  rows={4}
                  placeholder="Nhập ghi chú cho toàn bộ phiếu..."
                />
              </div>

              {/* Item Notes */}
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Ghi chú từng hàng</label>
                <div className="space-y-3">
                  {selectedSlip.items.map((item, i) => {
                    const itemKey = item.variantSku || item.productId
                    return (
                      <div key={i} className="border border-slate-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-slate-600 mb-2">{item.name}</div>
                        <input
                          type="text"
                          value={editItemNotes[itemKey] || ''}
                          onChange={(e) => setEditItemNotes({
                            ...editItemNotes,
                            [itemKey]: e.target.value,
                          })}
                          className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs"
                          placeholder="Ghi chú cho sản phẩm này..."
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingSlip(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Đang cập nhật...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PackingSlipTab
