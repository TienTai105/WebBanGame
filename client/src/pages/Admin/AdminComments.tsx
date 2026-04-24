import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal'
import OTPVerificationModal from '../../components/admin/OTPVerificationModal'
import { adminFetch } from '../../utils/adminFetch'
import { errorToast, successToast } from '../../utils/toast'

// ── Types ──────────────────────────────────────────────────
interface Comment {
  _id: string
  name: string
  email: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  newsId: { _id: string; title: string; slug?: string } | null
  userId?: { _id: string; name: string; email: string; avatar?: string }
  createdAt: string
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

// ── Constants ──────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:  { label: 'Chờ duyệt', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-500' },
  approved: { label: 'Đã duyệt',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Từ chối',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200', dot: 'bg-red-500' },
}

const STATUS_TABS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'Tất cả', icon: 'chat' },
  { key: 'pending', label: 'Chờ duyệt', icon: 'pending' },
  { key: 'approved', label: 'Đã duyệt', icon: 'check_circle' },
  { key: 'rejected', label: 'Từ chối', icon: 'cancel' },
]

const LIMIT = 20

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

// ── Component ──────────────────────────────────────────────
const AdminComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  // Delete flow
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null)
  const [otpModal, setOtpModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Detail modal
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)

  // ── Fetch comments ───────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(LIMIT))
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const { data: fullResponse, error } = await adminFetch<any>(`/api/admin/comments?${params}`)
      if (error) throw error
      const commentsData = fullResponse?.data || fullResponse
      setComments(commentsData?.comments || [])

      const pagination = commentsData?.pagination
      if (pagination) {
        setTotalPages(pagination.pages || 1)
        setTotalItems(pagination.total || 0)
      }
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải bình luận')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const { data: fullResponse, error } = await adminFetch<any>('/api/admin/comments/stats')
      if (error) throw error
      const statsData = fullResponse?.data || fullResponse
      setStats({
        total: statsData?.total || 0,
        pending: statsData?.pending || 0,
        approved: statsData?.approved || 0,
        rejected: statsData?.rejected || 0,
      })
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchComments() }, [fetchComments])
  useEffect(() => { fetchStats() }, [fetchStats])

  // ── Update status ────────────────────────────────────────
  const handleUpdateStatus = async (comment: Comment, newStatus: string) => {
    try {
      const { error } = await adminFetch(`/api/admin/comments/${comment._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      if (error) throw error
      successToast(newStatus === 'approved' ? 'Đã duyệt bình luận' : 'Đã từ chối bình luận')
      fetchComments()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật')
    }
  }

  // ── Delete flow ──────────────────────────────────────────
  const confirmDelete = (comment: Comment) => {
    setDeleteTarget(comment)
  }

  const handleDeleteConfirmed = () => {
    setOtpModal(true)
  }

  const handleOTPVerified = async (otpToken: string) => {
    setOtpModal(false)
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await adminFetch(`/api/admin/comments/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: otpToken ? { otpToken } : undefined,
      })
      if (error) throw error
      successToast('Đã xóa bình luận')
      setDeleteTarget(null)
      fetchComments()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể xóa')
    } finally {
      setDeleting(false)
    }
  }

  // ── Row actions ──────────────────────────────────────────
  const getRowActions = (comment: Comment): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      { icon: 'visibility', label: 'Chi tiết', color: 'indigo', onClick: () => setSelectedComment(comment) },
    ]
    if (comment.status !== 'approved') {
      items.push({ icon: 'check_circle', label: 'Duyệt', color: 'indigo', onClick: () => handleUpdateStatus(comment, 'approved') })
    }
    if (comment.status !== 'rejected') {
      items.push({ icon: 'cancel', label: 'Từ chối', color: 'red', onClick: () => handleUpdateStatus(comment, 'rejected') })
    }
    items.push({ icon: 'delete', label: 'Xóa', color: 'red', onClick: () => confirmDelete(comment) })
    return items
  }

  // ── Pagination ───────────────────────────────────────────
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
    <AdminLayout>
      {/* ── Header ───────────────────────────────────── */}
      <section className="mb-12">
        <AdminBreadcrumb items={[{ label: 'Quản Lý Bình Luận' }]} />
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-3">Quản Lý Bình Luận</h1>
        <p className="text-slate-500 mt-2 max-w-lg">Duyệt, quản lý và kiểm duyệt bình luận từ người dùng.</p>
      </section>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng bình luận', value: stats.total, icon: 'chat', textColor: 'text-slate-900', borderColor: 'border-indigo-500' },
          { label: 'Chờ duyệt', value: stats.pending, icon: 'pending', textColor: 'text-amber-600', borderColor: 'border-amber-400', alert: stats.pending > 0 },
          { label: 'Đã duyệt', value: stats.approved, icon: 'check_circle', textColor: 'text-emerald-600', borderColor: 'border-emerald-400' },
          { label: 'Từ chối', value: stats.rejected, icon: 'cancel', textColor: 'text-red-600', borderColor: 'border-red-400' },
        ].map((card) => (
          <div key={card.label} className={`p-6 bg-white rounded-xl border-l-4 ${card.borderColor} shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5`}>
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-slate-100 opacity-30">{card.icon}</span>
            <span className="uppercase tracking-widest text-slate-400 text-[10px] font-bold">{card.label}</span>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-extrabold ${card.textColor}`}>{card.value.toLocaleString()}</span>
              {card.alert && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> CẦN DUYỆT
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────── */}
      <div className="bg-white rounded-xl p-6 flex flex-wrap items-center gap-4 shadow-sm border border-slate-100 mb-6">
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

      {/* ── Comments List ────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">chat</span>
            <p className="font-bold">Không có bình luận nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {comments.map((comment) => {
              const statusInfo = STATUS_MAP[comment.status]
              return (
                <div key={comment._id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      {comment.userId?.avatar ? (
                        <img src={comment.userId.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-sm">{comment.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{comment.name}</span>
                        <span className="text-xs text-slate-400">{comment.email}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                          <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* News link */}
                      {comment.newsId && (
                        <p className="text-xs text-indigo-500 mb-1.5 truncate">
                          <span className="material-symbols-outlined text-xs align-middle mr-0.5">article</span>
                          {typeof comment.newsId === 'object' ? comment.newsId.title : 'Bài viết'}
                        </p>
                      )}

                      {/* Comment text */}
                      <p className="text-sm text-slate-600 line-clamp-2">{comment.content}</p>

                      {/* Time */}
                      <p className="text-xs text-slate-400 mt-2">{timeAgo(comment.createdAt)}</p>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {comment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(comment, 'approved')}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Duyệt"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(comment, 'rejected')}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            title="Từ chối"
                          >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        </>
                      )}
                      <ActionMenu items={getRowActions(comment)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
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
            {renderPageButtons()}
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

      {/* ── Detail Modal ─────────────────────────────── */}
      {selectedComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedComment(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-900">Chi Tiết Bình Luận</h2>
              <button onClick={() => setSelectedComment(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className="px-8 py-6 space-y-5">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-lg">{selectedComment.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{selectedComment.name}</p>
                  <p className="text-sm text-slate-500">{selectedComment.email}</p>
                </div>
              </div>

              {/* Status */}
              {(() => { const s = STATUS_MAP[selectedComment.status]; return (
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.color} border ${s.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              )})()}

              {/* News */}
              {selectedComment.newsId && typeof selectedComment.newsId === 'object' && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Bài viết</h4>
                  <p className="text-sm text-indigo-600 font-semibold">{selectedComment.newsId.title}</p>
                </div>
              )}

              {/* Content */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Nội dung</h4>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedComment.content}
                </div>
              </div>

              {/* Time */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Thời gian</h4>
                <p className="text-sm text-slate-700">{formatDate(selectedComment.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {selectedComment.status !== 'approved' && (
                  <button
                    onClick={() => { handleUpdateStatus(selectedComment, 'approved'); setSelectedComment(null) }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Duyệt
                  </button>
                )}
                {selectedComment.status !== 'rejected' && (
                  <button
                    onClick={() => { handleUpdateStatus(selectedComment, 'rejected'); setSelectedComment(null) }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    Từ chối
                  </button>
                )}
                <button
                  onClick={() => { confirmDelete(selectedComment); setSelectedComment(null) }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────────────── */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget && !otpModal}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        productName={`bình luận của "${deleteTarget?.name}"`}
        isDeleting={deleting}
      />

      {/* ── OTP Modal ────────────────────────────────── */}
      <OTPVerificationModal
        isOpen={otpModal}
        onClose={() => { setOtpModal(false); setDeleteTarget(null) }}
        onVerified={handleOTPVerified}
        actionDescription="Xóa bình luận"
      />
    </AdminLayout>
  )
}

export default AdminComments
