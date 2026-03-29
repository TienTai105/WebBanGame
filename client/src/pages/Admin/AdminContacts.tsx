import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal'
import OTPVerificationModal from '../../components/admin/OTPVerificationModal'
import adminApiCall from '../../utils/adminApi'
import { errorToast, successToast } from '../../utils/toast'

// ── Types ──────────────────────────────────────────────────
interface Contact {
  _id: string
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'pending' | 'read' | 'replied' | 'closed'
  adminNotes?: string
  repliedBy?: { _id: string; name: string; email: string }
  repliedAt?: string
  createdAt: string
  replyMessage?: string
}

type StatusFilter = 'all' | 'pending' | 'read' | 'replied' | 'closed'

// ── Constants ──────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: string }> = {
  pending: { label: 'Chờ xử lý', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', dot: 'bg-amber-500', icon: 'schedule' },
  read:    { label: 'Đã đọc',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200', dot: 'bg-blue-500', icon: 'mark_email_read' },
  replied: { label: 'Đã trả lời', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: 'reply' },
  closed:  { label: 'Đã đóng',   color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200', dot: 'bg-slate-400', icon: 'check_circle' },
}

const STATUS_TABS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'all',     label: 'Tất cả',     icon: 'contact_mail' },
  { key: 'pending', label: 'Chờ xử lý',  icon: 'schedule' },
  { key: 'read',    label: 'Đã đọc',     icon: 'mark_email_read' },
  { key: 'replied', label: 'Đã trả lời', icon: 'reply' },
  { key: 'closed',  label: 'Đã đóng',    icon: 'check_circle' },
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
const AdminContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, read: 0, replied: 0, closed: 0 })

  // Delete flow
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [otpModal, setOtpModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Detail / edit modal
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)
  // Reply message state
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  // ── Fetch contacts ──────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(LIMIT))
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const { data, error } = await adminApiCall<any>(`/contact/admin/all?${params}`)
      if (error) throw error
      setContacts(data?.contacts || [])

      const pagination = data?.pagination
      if (pagination) {
        setTotalPages(pagination.pages || 1)
        setTotalItems(pagination.total || 0)
      }
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải danh sách liên hệ')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await adminApiCall<any>('/contact/admin/stats')
      if (error) throw error
      setStats(data || { total: 0, pending: 0, read: 0, replied: 0, closed: 0 })
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { fetchStats() }, [fetchStats])

  // ── Update status ───────────────────────────────────────
  const handleUpdateStatus = async (contact: Contact, newStatus: string, notes?: string) => {
    try {
      const body: any = { status: newStatus }
      if (notes !== undefined) body.adminNotes = notes

      const { error } = await adminApiCall(`/contact/admin/${contact._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      if (error) throw error

      const statusLabels: Record<string, string> = {
        pending: 'Đặt về chờ xử lý',
        read: 'Đánh dấu đã đọc',
        replied: 'Đánh dấu đã trả lời',
        closed: 'Đã đóng liên hệ',
      }
      successToast(statusLabels[newStatus] || 'Cập nhật thành công')
      fetchContacts()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật')
    }
  }

  // ── Delete flow ─────────────────────────────────────────
  const confirmDelete = (contact: Contact) => {
    setDeleteTarget(contact)
  }

  const handleDeleteConfirmed = () => {
    setOtpModal(true)
  }

  const handleOTPVerified = async (otpToken: string) => {
    setOtpModal(false)
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await adminApiCall(`/contact/admin/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: otpToken ? { otpToken } : undefined,
      })
      if (error) throw error
      successToast('Đã xóa liên hệ')
      setDeleteTarget(null)
      fetchContacts()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể xóa')
    } finally {
      setDeleting(false)
    }
  }

  // ── Open detail modal ───────────────────────────────────
  const openDetail = (contact: Contact) => {
    setSelectedContact(contact)
    setAdminNotes(contact.adminNotes || '')
    setReplyMessage('')
    // Auto-mark as read if pending
    if (contact.status === 'pending') {
      handleUpdateStatus(contact, 'read')
    }
  }

  // ── Handle reply ─────────────────────────────
  const handleReply = async () => {
    if (!selectedContact) return
    if (!replyMessage.trim()) {
      errorToast('Vui lòng nhập nội dung phản hồi')
      return
    }
    setReplying(true)
    try {
      const body: any = { status: 'replied', replyMessage }
      const { error } = await adminApiCall(`/contact/admin/${selectedContact._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      if (error) throw error
      successToast('Đã gửi phản hồi cho khách hàng')
      setSelectedContact(null)
      fetchContacts()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể gửi phản hồi')
    } finally {
      setReplying(false)
    }
  }

  // ── Save notes in detail modal ──────────────────────────
  const handleSaveNotes = async () => {
    if (!selectedContact) return
    setSaving(true)
    try {
      const body: any = { status: selectedContact.status, adminNotes }
      const { error } = await adminApiCall(`/contact/admin/${selectedContact._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      if (error) throw error
      successToast('Đã lưu ghi chú')
      fetchContacts()
    } catch (err: any) {
      errorToast(err.message || 'Không thể lưu')
    } finally {
      setSaving(false)
    }
  }

  // ── Row actions ─────────────────────────────────────────
  const getRowActions = (contact: Contact): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      { icon: 'visibility', label: 'Chi tiết', color: 'indigo', onClick: () => openDetail(contact) },
    ]
    if (contact.status === 'pending') {
      items.push({ icon: 'mark_email_read', label: 'Đánh dấu đã đọc', color: 'indigo', onClick: () => handleUpdateStatus(contact, 'read') })
    }
    if (contact.status !== 'replied') {
      items.push({ icon: 'reply', label: 'Đã trả lời', color: 'indigo', onClick: () => handleUpdateStatus(contact, 'replied') })
    }
    if (contact.status !== 'closed') {
      items.push({ icon: 'check_circle', label: 'Đóng', color: 'indigo', onClick: () => handleUpdateStatus(contact, 'closed') })
    }
    items.push({ icon: 'delete', label: 'Xóa', color: 'red', onClick: () => confirmDelete(contact) })
    return items
  }

  // ── Pagination ──────────────────────────────────────────
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
        <AdminBreadcrumb items={[{ label: 'Quản Lý Liên Hệ' }]} />
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-3">Quản Lý Liên Hệ</h1>
        <p className="text-slate-500 mt-2 max-w-lg">Xem và phản hồi tin nhắn liên hệ từ khách hàng.</p>
      </section>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Tổng liên hệ', value: stats.total, icon: 'contact_mail', textColor: 'text-slate-900', borderColor: 'border-indigo-500' },
          { label: 'Chờ xử lý', value: stats.pending, icon: 'schedule', textColor: 'text-amber-600', borderColor: 'border-amber-400', alert: stats.pending > 0 },
          { label: 'Đã đọc', value: stats.read, icon: 'mark_email_read', textColor: 'text-blue-600', borderColor: 'border-blue-400' },
          { label: 'Đã trả lời', value: stats.replied, icon: 'reply', textColor: 'text-emerald-600', borderColor: 'border-emerald-400' },
          { label: 'Đã đóng', value: stats.closed, icon: 'check_circle', textColor: 'text-slate-600', borderColor: 'border-slate-400' },
        ].map((card) => (
          <div key={card.label} className={`p-6 bg-white rounded-xl border-l-4 ${card.borderColor} shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5`}>
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-slate-100 opacity-30">{card.icon}</span>
            <span className="uppercase tracking-widest text-slate-400 text-[10px] font-bold">{card.label}</span>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-extrabold ${card.textColor}`}>{card.value.toLocaleString()}</span>
              {card.alert && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> MỚI
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

      {/* ── Contacts List ────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">contact_mail</span>
            <p className="font-bold">Không có liên hệ nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {contacts.map((contact) => {
              const statusInfo = STATUS_MAP[contact.status]
              return (
                <div
                  key={contact._id}
                  className={`px-6 py-5 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                    contact.status === 'pending' ? 'bg-amber-50/30' : ''
                  }`}
                  onClick={() => openDetail(contact)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      contact.status === 'pending' ? 'bg-amber-100' : 'bg-indigo-100'
                    }`}>
                      <span className={`material-symbols-outlined text-lg ${
                        contact.status === 'pending' ? 'text-amber-600' : 'text-indigo-600'
                      }`}>
                        {contact.status === 'pending' ? 'mark_email_unread' : 'mail'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`font-bold text-sm ${contact.status === 'pending' ? 'text-slate-900' : 'text-slate-700'}`}>
                          {contact.fullName}
                        </span>
                        <span className="text-xs text-slate-400">{contact.email}</span>
                        {contact.phone && (
                          <span className="text-xs text-slate-400">
                            <span className="material-symbols-outlined text-xs align-middle mr-0.5">phone</span>
                            {contact.phone}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                          <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Subject */}
                      <p className={`text-sm mb-1 truncate ${contact.status === 'pending' ? 'text-slate-900 font-semibold' : 'text-slate-600 font-medium'}`}>
                        {contact.subject}
                      </p>

                      {/* Message preview */}
                      <p className="text-sm text-slate-500 line-clamp-1">{contact.message}</p>

                      {/* Footer info */}
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-slate-400">{timeAgo(contact.createdAt)}</p>
                        {contact.repliedBy && (
                          <span className="text-xs text-emerald-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">reply</span>
                            {contact.repliedBy.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={getRowActions(contact)} />
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
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedContact(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-extrabold text-slate-900">Chi Tiết Liên Hệ</h2>
              <button onClick={() => setSelectedContact(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Contact info */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold text-xl">{selectedContact.fullName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900">{selectedContact.fullName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">email</span>
                      {selectedContact.email}
                    </span>
                    {selectedContact.phone && (
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">phone</span>
                        {selectedContact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status + time */}
              <div className="flex items-center gap-4 flex-wrap">
                {(() => { const s = STATUS_MAP[selectedContact.status]; return (
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.color} border ${s.border}`}>
                    <span className="material-symbols-outlined text-xs">{s.icon}</span>
                    {s.label}
                  </span>
                )})()}
                <span className="text-sm text-slate-400">{formatDate(selectedContact.createdAt)}</span>
                {selectedContact.repliedBy && (
                  <span className="text-sm text-emerald-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">reply</span>
                    Trả lời bởi {selectedContact.repliedBy.name}
                    {selectedContact.repliedAt && ` — ${formatDate(selectedContact.repliedAt)}`}
                  </span>
                )}
              </div>

              {/* Subject */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Chủ đề</h4>
                <p className="text-base text-slate-900 font-semibold">{selectedContact.subject}</p>
              </div>

              {/* Message */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Nội dung</h4>
                <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedContact.message}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Ghi chú nội bộ</h4>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Thêm ghi chú nội bộ cho liên hệ này..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
                  </button>
                </div>
              </div>

              {/* Reply section (only if not replied) */}
              {selectedContact.status !== 'replied' && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Phản hồi khách hàng qua email</h4>
                  <textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Nhập nội dung phản hồi..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all"
                    rows={4}
                  />
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {selectedContact.status !== 'read' && selectedContact.status !== 'closed' && (
                      <button
                        onClick={() => { handleUpdateStatus(selectedContact, 'read'); setSelectedContact(null) }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">mark_email_read</span>
                        Đã đọc
                      </button>
                    )}
                    <button
                      onClick={handleReply}
                      disabled={replying}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">reply</span>
                      {replying ? 'Đang gửi...' : 'Gửi phản hồi & Đã trả lời'}
                    </button>
                    {selectedContact.status !== 'closed' && (
                      <button
                        onClick={() => { handleUpdateStatus(selectedContact, 'closed'); setSelectedContact(null) }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Đóng
                      </button>
                    )}
                    <button
                      onClick={() => { confirmDelete(selectedContact); setSelectedContact(null) }}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      Xóa
                    </button>
                  </div>
                </div>
              )}
              {/* If already replied, show the reply message */}
              {selectedContact.status === 'replied' && selectedContact.replyMessage && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Nội dung phản hồi đã gửi</h4>
                  <div className="bg-emerald-50 rounded-xl p-5 text-sm text-emerald-800 whitespace-pre-wrap leading-relaxed">
                    {selectedContact.replyMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────────────── */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget && !otpModal}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        productName={`liên hệ của "${deleteTarget?.fullName}"`}
        isDeleting={deleting}
      />

      {/* ── OTP Modal ────────────────────────────────── */}
      <OTPVerificationModal
        isOpen={otpModal}
        onClose={() => { setOtpModal(false); setDeleteTarget(null) }}
        onVerified={handleOTPVerified}
        actionDescription="Xóa liên hệ"
      />
    </AdminLayout>
  )
}

export default AdminContacts
