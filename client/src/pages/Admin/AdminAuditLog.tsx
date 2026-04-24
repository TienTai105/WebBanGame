import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import { errorToast } from '../../utils/toast'
import { adminFetch } from '../../utils/adminFetch'

interface AuditLogEntry {
  _id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'EXPORT' | 'IMPORT' 
  entity: string
  entityId: string
  oldValue?: any
  newValue?: any
  changes?: Record<string, { old: any; new: any }>
  userId: { _id: string; name: string; email: string }
  userEmail?: string
  targetUser?: { name: string; email: string }
  ipAddress?: string
  reason?: string
  status?: 'success' | 'failed'
  errorMessage?: string
  createdAt: string
}

interface AuditLogResponse {
  logs: AuditLogEntry[]
  pagination: {
    current: number
    limit: number
    total: number
    pages: number
  }
}

const ITEMS_PER_PAGE = 20

const AdminAuditLog: React.FC = () => {
  const [data, setData] = useState<AuditLogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
        })
        if (filters.action) params.set('action', filters.action)
        if (filters.entity) params.set('entity', filters.entity)

        const { data: fullResponse, error } = await adminFetch<{ success: boolean; data: AuditLogResponse }>(
          `/api/admin/audit-logs?${params.toString()}`
        )
        if (error) throw error
        setData(fullResponse?.data || null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load audit logs'
        errorToast(msg)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [page, filters])

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'add_circle', label: 'Create' }
      case 'UPDATE':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: 'edit', label: 'Update' }
      case 'DELETE':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: 'delete', label: 'Delete' }
      case 'STATUS_CHANGE':
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: 'swap_horiz', label: 'Status' }
      case 'EXPORT':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: 'download', label: 'Export' }
      case 'IMPORT':
        return { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'upload', label: 'Import' }
      case 'LOGIN':
        return { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', icon: 'login', label: 'Login' }
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: 'info', label: action }
    }
  }

  const getEntityConfig = (entity: string) => {
    switch (entity) {
      case 'Product': return { icon: 'inventory_2', color: 'text-blue-600' }
      case 'Order': return { icon: 'shopping_cart', color: 'text-indigo-600' }
      case 'User': return { icon: 'person', color: 'text-emerald-600' }
      case 'Promotion': return { icon: 'sell', color: 'text-orange-600' }
      case 'News': return { icon: 'newspaper', color: 'text-purple-600' }
      case 'Inventory': return { icon: 'warehouse', color: 'text-cyan-600' }
      case 'Review': return { icon: 'rate_review', color: 'text-amber-600' }
      case 'Comment': return { icon: 'comment', color: 'text-pink-600' }
      case 'Shipment': return { icon: 'local_shipping', color: 'text-teal-600' }
      default: return { icon: 'description', color: 'text-slate-600' }
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const getDescription = (log: AuditLogEntry) => {
    const actor = log.userId?.name || log.userEmail || 'Unknown'
    const entity = log.entity

    switch (log.action) {
      case 'CREATE': {
        const name = log.newValue?.name || log.newValue?.title || log.newValue?.code || ''
        return <><span className="font-semibold text-slate-900">{actor}</span> đã tạo {entity.toLowerCase()} <span className="font-semibold text-slate-900">{name}</span></>
      }
      case 'UPDATE': {
        const name = log.newValue?.name || log.newValue?.title || log.newValue?.code || log.targetUser?.name || ''
        return <><span className="font-semibold text-slate-900">{actor}</span> đã cập nhật {entity.toLowerCase()} <span className="font-semibold text-slate-900">{name}</span></>
      }
      case 'DELETE': {
        const name = log.oldValue?.name || log.oldValue?.title || log.oldValue?.code || ''
        return <><span className="font-semibold text-slate-900">{actor}</span> đã xóa {entity.toLowerCase()} <span className="font-semibold text-slate-900">{name}</span></>
      }
      case 'STATUS_CHANGE': {
        const changes = log.changes
        if (changes) {
          const keys = Object.keys(changes)
          const firstKey = keys[0]
          if (firstKey && changes[firstKey]) {
            return <><span className="font-semibold text-slate-900">{actor}</span> đã đổi {firstKey} {entity.toLowerCase()} từ <span className="font-medium text-red-600">{String(changes[firstKey].old)}</span> → <span className="font-medium text-emerald-600">{String(changes[firstKey].new)}</span></>
          }
        }
        return <><span className="font-semibold text-slate-900">{actor}</span> đã thay đổi trạng thái {entity.toLowerCase()}</>
      }
    }
  }

  const renderChangesDetail = (log: AuditLogEntry) => {
    const sections: JSX.Element[] = []

    if (log.changes) {
      sections.push(
        <div key="changes" className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Thay đổi</p>
          {Object.entries(log.changes).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="text-slate-500 font-medium min-w-[100px]">{key}:</span>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs line-through">{JSON.stringify(val.old)}</span>
              <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs">{JSON.stringify(val.new)}</span>
            </div>
          ))}
        </div>
      )
    }

    if (log.oldValue && log.action === 'DELETE') {
      sections.push(
        <div key="oldValue" className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Dữ liệu đã xóa</p>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <pre className="text-xs text-red-700 whitespace-pre-wrap">{JSON.stringify(log.oldValue, null, 2)}</pre>
          </div>
        </div>
      )
    }

    if (log.newValue && log.action === 'CREATE') {
      sections.push(
        <div key="newValue" className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Dữ liệu đã tạo</p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <pre className="text-xs text-emerald-700 whitespace-pre-wrap">{JSON.stringify(log.newValue, null, 2)}</pre>
          </div>
        </div>
      )
    }

    if (log.oldValue && log.newValue && log.action === 'UPDATE') {
      sections.push(
        <div key="diff" className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Trước</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(log.oldValue, null, 2)}</pre>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Sau</p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <pre className="text-xs text-emerald-700 whitespace-pre-wrap">{JSON.stringify(log.newValue, null, 2)}</pre>
            </div>
          </div>
        </div>
      )
    }

    if (log.ipAddress) {
      sections.push(
        <div key="meta" className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>IP: {log.ipAddress}</span>
          {log.reason && <span>Lý do: {log.reason}</span>}
        </div>
      )
    }

    return sections.length > 0 ? sections : <p className="text-xs text-slate-400">Không có chi tiết</p>
  }

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN']
  const entities = ['Product', 'Order', 'User', 'Promotion', 'News', 'Inventory', 'Review', 'Comment', 'Contact']

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Nhật ký hoạt động
          </h2>
          <AdminBreadcrumb items={[{ label: 'Audit Log' }]} />
        </div>
        {data && (
          <p className="text-sm text-slate-500">
            Tổng cộng <span className="font-bold text-slate-900">{data.pagination.total}</span> bản ghi
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động:</span>
            <select
              value={filters.action}
              onChange={(e) => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1) }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Tất cả</option>
              {actions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đối tượng:</span>
            <select
              value={filters.entity}
              onChange={(e) => { setFilters(f => ({ ...f, entity: e.target.value })); setPage(1) }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Tất cả</option>
              {entities.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {(filters.action || filters.entity) && (
            <button
              onClick={() => { setFilters({ action: '', entity: '' }); setPage(1) }}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      ) : data && data.logs.length > 0 ? (
        <div className="space-y-3">
          {data.logs.map((log) => {
            const actionCfg = getActionConfig(log.action)
            const entityCfg = getEntityConfig(log.entity)
            const isExpanded = expandedId === log._id

            return (
              <div
                key={log._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
              >
                {/* Main Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log._id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  {/* Entity Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-xl ${entityCfg.color}`}>
                      {entityCfg.icon}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 truncate">
                      {getDescription(log)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">ID: {log.entityId?.toString().slice(-8)}</span>
                    </div>
                  </div>

                  {/* Action Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${actionCfg.bg} ${actionCfg.text} border ${actionCfg.border} flex-shrink-0`}>
                    <span className="material-symbols-outlined text-sm">{actionCfg.icon}</span>
                    {actionCfg.label}
                  </span>

                  {/* Entity Badge */}
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg flex-shrink-0">
                    {log.entity}
                  </span>

                  {/* Expand Icon */}
                  <span className={`material-symbols-outlined text-slate-300 text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 ml-14 border-t border-slate-100 mt-0 pt-4 space-y-3">
                    {renderChangesDetail(log)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">history</span>
          <p className="text-slate-500">Chưa có nhật ký hoạt động nào</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-500">
            Trang {data.pagination.current} / {data.pagination.pages} ({data.pagination.total} bản ghi)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(data.pagination.pages, 7) }, (_, i) => {
              let pageNum: number
              const totalPages = data.pagination.pages
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    page === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminAuditLog
