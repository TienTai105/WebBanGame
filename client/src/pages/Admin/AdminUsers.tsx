import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import { errorToast, successToast } from '../../utils/toast'
import { getSocket } from '../../utils/socket'
import { STAFF_PERMISSIONS } from '../../context/AdminAuthContext'
import { adminFetch } from '../../utils/adminFetch'

// ── Types ──────────────────────────────────────────────────
interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'staff' | 'admin'
  permissions?: string[]
  defaultOTP?: string
  isActive: boolean
  avatar?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

interface AuditLogEntry {
  _id: string
  action: string
  entity: string
  entityId: string
  changes?: Record<string, { old: any; new: any }>
  userId: { _id: string; name: string; email: string } | string
  targetUser?: { name: string; email: string }
  createdAt: string
}

interface UserStats {
  totalUsers: number
  totalAdmins: number
  totalStaff: number
  activeUsers: number
  onlineUsers: number
}

// ── Helpers ────────────────────────────────────────────────
type RoleType = User['role']
type RoleTab = 'all' | RoleType

const ROLE_MAP: Record<RoleType, { label: string; color: string; bg: string; border: string }> = {
  admin:    { label: 'ADMIN',    color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  staff:    { label: 'STAFF',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  customer: { label: 'CUSTOMER', color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200' },
}

const ROLE_TABS: { key: RoleTab; label: string; icon: string; borderColor: string; textColor: string }[] = [
  { key: 'all',      label: 'Tất Cả',       icon: 'group',                borderColor: 'border-indigo-500', textColor: '' },
  { key: 'admin',    label: 'Quản Trị Viên', icon: 'admin_panel_settings', borderColor: 'border-indigo-400', textColor: 'text-indigo-600' },
  { key: 'staff',    label: 'Nhân Viên',     icon: 'badge',                borderColor: 'border-amber-400',  textColor: 'text-amber-600' },
  { key: 'customer', label: 'Khách Hàng',    icon: 'person',               borderColor: 'border-emerald-400', textColor: 'text-emerald-600' },
]

const formatDate = (iso: string) => {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
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
const AdminUsers: React.FC = () => {
  // Data
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, totalAdmins: 0, totalStaff: 0, activeUsers: 0, onlineUsers: 0 })
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  // Filters
  const [activeTab, setActiveTab] = useState<RoleTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const LIMIT = 10

  // Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingRole, setEditingRole] = useState(false)
  const [newRole, setNewRole] = useState<RoleType>('customer')
  const [updating, setUpdating] = useState(false)
  const [editingPermissions, setEditingPermissions] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [defaultOTP, setDefaultOTP] = useState('')

  // Audit Log Modal
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPage, setLogsPage] = useState(1)

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' as RoleType })
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [logsTotalPages, setLogsTotalPages] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsFilter, setLogsFilter] = useState<string>('all')

  // ── Authenticated fetch ──────────────────────────────────

  // Use shared adminFetch helper imported from utils/adminFetch

  // ── Fetch users ──────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(LIMIT))
      params.set('scope', 'all')
      if (activeTab !== 'all') params.set('role', activeTab)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const { data: json, error } = await adminFetch(`/api/admin/users?${params}`)
      if (error) throw error
      setUsers(json.data?.users || [])
      setTotalPages(json.data?.pagination?.pages || 1)
      setTotalUsers(json.data?.pagination?.total || 0)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [currentPage, activeTab, searchQuery, adminFetch])

  // ── Fetch stats ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const { data: json, error } = await adminFetch('/api/admin/users/stats')
      if (error) throw error
      if (json.data) setStats(json.data)
    } catch { /* silent */ }
  }, [adminFetch])

  // ── Fetch audit logs ─────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    try {
      const { data: json, error } = await adminFetch('/api/admin/audit-logs?entity=User&limit=5&adminOnly=true')
      if (error) throw error
      if (json.data?.logs) setAuditLogs(json.data.logs)
    } catch { /* silent */ }
  }, [adminFetch])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchAuditLogs() }, [fetchAuditLogs])

  // ── Fetch all audit logs (modal) ─────────────────────────
  const fetchAllLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('entity', 'User')
      params.set('page', String(logsPage))
      params.set('limit', '10')
      params.set('adminOnly', 'true')
      if (logsFilter !== 'all') params.set('action', logsFilter)
      const { data: json, error } = await adminFetch(`/api/admin/audit-logs?${params}`)
      if (error) throw error
      if (json.data) {
        setAllLogs(json.data.logs || [])
        setLogsTotalPages(json.data.pagination?.pages || 1)
        setLogsTotal(json.data.pagination?.total || 0)
      }
    } catch { /* silent */ }
    finally { setLogsLoading(false) }
  }, [logsPage, logsFilter, adminFetch])

  useEffect(() => { if (showAllLogs) fetchAllLogs() }, [showAllLogs, fetchAllLogs])

  // ── Socket.IO: real-time online users ────────────────────
  useEffect(() => {
    const handleOnlineUsers = (data: { userIds: string[]; count: number }) => {
      setOnlineUserIds(new Set(data.userIds))
      setStats((prev) => ({ ...prev, onlineUsers: data.count }))
    }

    const setupSocket = () => {
      const s = getSocket()
      if (!s) return
      s.off('onlineUsers', handleOnlineUsers)
      s.on('onlineUsers', handleOnlineUsers)
      s.emit('getOnlineUsers')
    }

    setupSocket()
    window.addEventListener('socket-connected', setupSocket)

    return () => {
      window.removeEventListener('socket-connected', setupSocket)
      const s = getSocket()
      if (s) s.off('onlineUsers', handleOnlineUsers)
    }
  }, [])

  // ── Toggle active ────────────────────────────────────────
  const handleToggleActive = async (user: User) => {
    try {
      const { data: json, error } = await adminFetch(`/api/admin/users/${user._id}/toggle-active`, { method: 'PUT' })
      if (error) throw error
      successToast(json.message || 'Cập nhật thành công')
      fetchUsers()
      fetchStats()
      fetchAuditLogs()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật trạng thái')
    }
  }

  // ── Change role ──────────────────────────────────────────
  const handleChangeRole = async () => {
    if (!selectedUser) return
    setUpdating(true)
    try {
      await adminFetch(`/api/admin/users/${selectedUser._id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      })
      successToast('Cập nhật vai trò thành công')
      setEditingRole(false)
      setSelectedUser(null)
      fetchUsers()
      fetchStats()
      fetchAuditLogs()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật vai trò')
    } finally {
      setUpdating(false)
    }
  }

  // ── Save permissions ─────────────────────────────────────
  const handleSavePermissions = async () => {
    if (!selectedUser) return
    setSavingPermissions(true)
    try {
      await adminFetch(`/api/admin/users/${selectedUser._id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: selectedPermissions, defaultOTP: defaultOTP || null }),
      })
      successToast('Cập nhật quyền thành công')
      setEditingPermissions(false)
      setSelectedUser(null)
      fetchUsers()
      fetchAuditLogs()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật quyền')
    } finally {
      setSavingPermissions(false)
    }
  }

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  // ── Reset password ───────────────────────────────────────
  const handleResetPassword = async (user: User) => {
    try {
      const { data: json, error } = await adminFetch(`/api/admin/users/${user._id}/reset-password`, { method: 'POST' })
      if (error) throw error
      successToast(json.message || 'Đã gửi email đặt lại mật khẩu')
    } catch (err: any) {
      errorToast(err.message || 'Không thể gửi email')
    }
  }

  // ── Create user ───────────────────────────────────────────
  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      errorToast('Tên, email và mật khẩu là bắt buộc')
      return
    }
    if (createForm.password.length < 6) {
      errorToast('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setCreating(true)
    try {
      await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      successToast('Tạo người dùng thành công')
      setShowCreateModal(false)
      setCreateForm({ name: '', email: '', password: '', phone: '', role: 'customer' })
      fetchUsers()
      fetchStats()
      fetchAuditLogs()
    } catch (err: any) {
      errorToast(err.message || 'Không thể tạo người dùng')
    } finally {
      setCreating(false)
    }
  }

  // ── Row actions ──────────────────────────────────────────
  const getRowActions = (user: User): ActionMenuItem[] => {
    const isAdmin = user.role === 'admin'
    const items: ActionMenuItem[] = [
      { icon: 'visibility', label: 'Chi tiết', color: 'indigo', onClick: () => { setSelectedUser(user); setEditingRole(false) } },
    ]
    if (!isAdmin) {
      items.push({
        icon: 'swap_horiz',
        label: 'Đổi vai trò',
        color: 'indigo',
        onClick: () => { setSelectedUser(user); setNewRole(user.role); setEditingRole(true); setEditingPermissions(false) },
      })
    }
    if (user.role === 'staff') {
      items.push({
        icon: 'shield_person',
        label: 'Quản lý quyền',
        color: 'indigo',
        onClick: () => { setSelectedUser(user); setSelectedPermissions(user.permissions || []); setDefaultOTP(user.defaultOTP || ''); setEditingPermissions(true); setEditingRole(false) },
      })
    }
    items.push({ icon: 'lock_reset', label: 'Đặt lại mật khẩu', color: 'default', onClick: () => handleResetPassword(user) })
    if (!isAdmin) {
      items.push({
        icon: user.isActive ? 'block' : 'check_circle',
        label: user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
        color: user.isActive ? 'red' : 'indigo',
        onClick: () => handleToggleActive(user),
      })
    }
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

  // ── Search debounce ──────────────────────────────────────
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Audit log action labels ──────────────────────────────
  const getAuditLabel = (log: AuditLogEntry) => {
    const adminName = typeof log.userId === 'object' ? log.userId.name : 'Hệ thống'
    const targetName = log.targetUser?.name
    const changes = log.changes

    switch (log.action) {
      case 'STATUS_CHANGE': {
        const isActive = changes?.isActive
        if (isActive) {
          const status = isActive.new ? 'kích hoạt' : 'vô hiệu hóa'
          return <>
            <span className="font-bold text-indigo-300">{adminName}</span> đã <span className={`font-semibold ${isActive.new ? 'text-emerald-400' : 'text-red-400'}`}>{status}</span> tài khoản {targetName && <span className="font-semibold text-sky-300">{targetName}</span>}
          </>
        }
        return <><span className="font-bold text-indigo-300">{adminName}</span> đã thay đổi trạng thái {targetName && <>tài khoản <span className="font-semibold text-sky-300">{targetName}</span></>}</>
      }
      case 'UPDATE': {
        if (changes?.role) {
          const oldRole = (changes.role.old || '').toUpperCase()
          const newRole = (changes.role.new || '').toUpperCase()
          return <>
            <span className="font-bold text-indigo-300">{adminName}</span> đã đổi vai trò {targetName && <><span className="font-semibold text-sky-300">{targetName}</span> </>}từ <span className="font-semibold text-amber-300">{oldRole}</span> → <span className="font-semibold text-emerald-300">{newRole}</span>
          </>
        }
        return <><span className="font-bold text-indigo-300">{adminName}</span> đã cập nhật thông tin {targetName ? <span className="font-semibold text-sky-300">{targetName}</span> : 'người dùng'}</>
      }
      case 'CREATE':
        return <><span className="font-bold text-indigo-300">{adminName}</span> đã tạo tài khoản {targetName && <span className="font-semibold text-sky-300">{targetName}</span>}</>
      case 'DELETE':
        return <><span className="font-bold text-red-300">{adminName}</span> đã xóa tài khoản {targetName && <span className="font-semibold text-sky-300">{targetName}</span>}</>
      default:
        return <><span className="font-bold text-indigo-300">{adminName}</span> đã thực hiện: {log.action}</>
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* ── Header ───────────────────────────────────── */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <AdminBreadcrumb items={[{ label: 'Quản Lý Người Dùng' }]} />
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-3">Quản Lý User - Phân Quyền</h1>
          <p className="text-slate-500 mt-2 max-w-lg">
            Kiểm soát truy cập và bảo mật hệ thống vận hành Voltrix.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreateForm({ name: '', email: '', password: '', phone: '', role: 'customer' }) }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Thêm User
        </button>
      </section>

      {/* ── Bento Grid Stats ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Tổng User', value: stats.totalUsers, icon: 'group', textColor: 'text-slate-900', borderColor: 'border-indigo-500' },
          { label: 'Quản Trị Viên', value: stats.totalAdmins, icon: 'admin_panel_settings', textColor: 'text-indigo-600', borderColor: 'border-indigo-400' },
          { label: 'Nhân Viên', value: stats.totalStaff, icon: 'badge', textColor: 'text-amber-600', borderColor: 'border-amber-400' },
          { label: 'Đang Trực Tuyến', value: stats.onlineUsers, icon: 'radio_button_checked', textColor: 'text-emerald-600', borderColor: 'border-emerald-400', pulse: true },
          { label: 'Khách Hàng', value: stats.totalUsers - stats.totalAdmins - stats.totalStaff, icon: 'person', textColor: 'text-sky-600', borderColor: 'border-sky-400' },
        ].map((card) => (
          <div key={card.label} className={`p-6 bg-white rounded-xl border-l-4 ${card.borderColor} shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5`}>
            <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-slate-100 opacity-30">{card.icon}</span>
            <span className="uppercase tracking-widest text-slate-400 text-[10px] font-bold">{card.label}</span>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-extrabold ${card.textColor}`}>{card.value.toLocaleString()}</span>
              {card.pulse && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> TRỰC TUYẾN
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content: Table + Audit Log ──────────── */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── User Table ─────────────────────────────── */}
        <div className="flex-1 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl p-6 flex flex-wrap items-center gap-6 shadow-sm border border-slate-100">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-indigo-400 text-sm"
                  placeholder="Tìm theo tên, email hoặc SĐT..."
                />
              </div>
              {/* Role filter pills */}
              <div className="hidden md:flex items-center gap-2">
                {ROLE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === tab.key
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const csv = [
                    ['Tên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Ngày tạo'].join(','),
                    ...users.map((u) =>
                      [u.name, u.email, u.phone || '', u.role, u.isActive ? 'Hoạt động' : 'Vô hiệu hóa', formatDate(u.createdAt)].join(',')
                    ),
                  ].join('\n')
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="p-3 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all"
                title="Xuất CSV"
              >
                <span className="material-symbols-outlined text-sm">download</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">person_off</span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy người dùng</h3>
                <p className="text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Họ Và Tên</th>
                        <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Vai Trò</th>
                        <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Trạng Thái</th>
                        <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400">Lần Cuối Đăng Nhập</th>
                        <th className="px-6 py-5 text-[11px] uppercase font-bold tracking-[0.1em] text-slate-400 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => {
                        const role = ROLE_MAP[user.role]
                        return (
                          <tr key={user._id} className={`hover:bg-slate-50/60 transition-colors duration-200 ${!user.isActive ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm overflow-hidden">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    user.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-slate-900">{user.name}</p>
                                  <p className="text-[11px] text-slate-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${role.bg} ${role.color} border ${role.border}`}>
                                {role.label}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                  <span className={`text-xs font-medium ${user.isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                  </span>
                                </div>
                                {onlineUserIds.has(user._id) ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-green-600">Trực tuyến</span>
                                  </div>
                                ) : user.lastLogin ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-medium text-slate-400">Ngoại tuyến</span>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-xs text-slate-500">
                              {user.lastLogin ? timeAgo(user.lastLogin) : 'Chưa đăng nhập'}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <ActionMenu items={getRowActions(user)} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    Hiển thị {(currentPage - 1) * LIMIT + 1} - {Math.min(currentPage * LIMIT, totalUsers)} / {totalUsers.toLocaleString()} Users
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
        </div>

        {/* ── Sidebar: Audit Log ─────────────────────── */}
        <div className="w-full lg:w-96 space-y-6">
          {/* Audit Log */}
          <div className="bg-slate-900 text-white p-6 rounded-xl relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-4 -top-4 text-8xl text-white opacity-[0.03] rotate-12">policy</span>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Audit Log Gần Đây</h4>
                <button
                  onClick={() => { setShowAllLogs(true); setLogsPage(1); setLogsFilter('all') }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wide transition-colors"
                >
                  Xem tất cả
                </button>
              </div>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Chưa có nhật ký nào.</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="flex gap-3 items-start">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        log.action === 'DELETE' || log.action === 'STATUS_CHANGE' ? 'bg-red-400' : 'bg-indigo-400'
                      }`} />
                      <p className="text-[11px] leading-tight text-slate-300">
                        {getAuditLabel(log)}
                        <br />
                        <span className="text-[9px] text-slate-500">{timeAgo(log.createdAt)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-indigo-600">shield_person</span>
              <h3 className="font-bold text-lg text-slate-900">Phân Quyền</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vai trò hệ thống</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-sm">admin_panel_settings</span>
                      <span className="font-bold text-indigo-700 text-xs">ADMIN</span>
                    </div>
                    <span className="text-xs text-indigo-500">Toàn quyền</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-sm">badge</span>
                      <span className="font-bold text-amber-700 text-xs">STAFF</span>
                    </div>
                    <span className="text-xs text-amber-500">Hạn chế</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
                      <span className="font-bold text-slate-600 text-xs">CUSTOMER</span>
                    </div>
                    <span className="text-xs text-slate-400">Cơ bản</span>
                  </div>
                </div>
              </div>
              <hr className="border-slate-100" />
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 mt-0.5">verified_user</span>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">Xác Minh Hành Động</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Các hành động đổi vai trò hoặc vô hiệu hóa tài khoản đều được ghi lại trong Audit Log.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── User Detail / Role Edit Modal ────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setSelectedUser(null); setEditingRole(false); setEditingPermissions(false) }}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {editingRole ? 'Đổi Vai Trò' : editingPermissions ? 'Quản Lý Quyền' : 'Chi Tiết Người Dùng'}
                </h2>
              </div>
              <button onClick={() => { setSelectedUser(null); setEditingRole(false); setEditingPermissions(false) }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* User info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-lg text-slate-900">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-sm text-slate-400">{selectedUser.phone}</p>}
                </div>
              </div>

              {editingRole ? (
                <>
                  {/* Role selection */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Chọn vai trò mới</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['admin', 'staff', 'customer'] as RoleType[]).map((role) => {
                        const r = ROLE_MAP[role]
                        const isActive = newRole === role
                        return (
                          <button
                            key={role}
                            onClick={() => setNewRole(role)}
                            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                              isActive
                                ? `${r.bg} ${r.color} ${r.border} ring-2 ring-offset-1 ring-indigo-300`
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {role === 'admin' ? 'admin_panel_settings' : role === 'staff' ? 'badge' : 'person'}
                            </span>
                            <span className="text-xs font-bold uppercase">{r.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Change summary */}
                  {newRole !== selectedUser.role && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-xs uppercase font-bold text-amber-700 tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Thay đổi sẽ áp dụng
                      </h4>
                      <p className="text-sm text-amber-800">
                        Vai trò: <span className="font-bold">{ROLE_MAP[selectedUser.role].label}</span> → <span className="font-bold">{ROLE_MAP[newRole].label}</span>
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setEditingRole(false)}
                      className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleChangeRole}
                      disabled={updating || newRole === selectedUser.role}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {updating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </>
              ) : editingPermissions ? (
                <>
                  {/* Permissions editor for staff */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                      Phân quyền truy cập cho Staff
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {STAFF_PERMISSIONS.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key)
                        return (
                          <button
                            key={perm.key}
                            onClick={() => togglePermission(perm.key)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{perm.icon}</span>
                            <span className="text-sm font-bold">{perm.label}</span>
                            {isChecked && (
                              <span className="material-symbols-outlined text-sm ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Default OTP setting */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                      Mã OTP Mặc Định
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={defaultOTP}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setDefaultOTP(v)
                        }}
                        maxLength={6}
                        placeholder="Để trống = gửi OTP qua email"
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm font-mono tracking-widest"
                      />
                      {defaultOTP && (
                        <button
                          onClick={() => setDefaultOTP('')}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Xóa mã mặc định"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {defaultOTP
                        ? `Staff sẽ dùng mã "${defaultOTP}" thay vì OTP qua email.`
                        : 'Nếu để trống, OTP sẽ được gửi qua email khi thao tác nguy hiểm.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{selectedPermissions.length}/{STAFF_PERMISSIONS.length}</span> module được cấp quyền.
                      Staff sẽ chỉ thấy các mục trong sidebar tương ứng với quyền được cấp.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setEditingPermissions(false)}
                      className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      disabled={savingPermissions}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingPermissions && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Lưu quyền
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* View mode details */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {(() => { const r = ROLE_MAP[selectedUser.role]; return (
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase ${r.bg} ${r.color} border ${r.border}`}>
                        {r.label}
                      </span>
                    )})()}
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase ${
                      selectedUser.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedUser.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Ngày tạo</h4>
                      <p className="text-sm text-slate-700">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Đăng nhập cuối</h4>
                      <p className="text-sm text-slate-700">{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Chưa đăng nhập'}</p>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Điện thoại</h4>
                        <p className="text-sm text-slate-700">{selectedUser.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Staff permissions display */}
                  {selectedUser.role === 'staff' && (
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Quyền truy cập</h4>
                      {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.permissions.map((p) => {
                            const perm = STAFF_PERMISSIONS.find((sp) => sp.key === p)
                            return (
                              <span key={p} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                                <span className="material-symbols-outlined text-xs">{perm?.icon || 'check'}</span>
                                {perm?.label || p}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Chưa được cấp quyền nào</p>
                      )}
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    {selectedUser.role !== 'admin' && (
                      <button
                        onClick={() => { setNewRole(selectedUser.role); setEditingRole(true); setEditingPermissions(false) }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">swap_horiz</span>
                        Đổi vai trò
                      </button>
                    )}
                    {selectedUser.role === 'staff' && (
                      <button
                        onClick={() => { setSelectedPermissions(selectedUser.permissions || []); setDefaultOTP(selectedUser.defaultOTP || ''); setEditingPermissions(true); setEditingRole(false) }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">shield_person</span>
                        Quản lý quyền
                      </button>
                    )}
                    {selectedUser.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleActive(selectedUser)}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                          selectedUser.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{selectedUser.isActive ? 'block' : 'check_circle'}</span>
                        {selectedUser.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create User Modal ────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600">person_add</span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Thêm Người Dùng</h2>
                  <p className="text-xs text-slate-400">Tạo tài khoản mới trong hệ thống</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">Tên <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                  placeholder="Nhập họ và tên..."
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                  placeholder="email@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">Mật khẩu <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm pr-12"
                    placeholder="Tối thiểu 6 ký tự..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">{showCreatePassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">Số điện thoại</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
                  placeholder="0xxx xxx xxx"
                />
              </div>

              {/* Role selection */}
              <div>
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Vai trò</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['customer', 'staff', 'admin'] as RoleType[]).map((r) => {
                    const rm = ROLE_MAP[r]
                    const selected = createForm.role === r
                    return (
                      <button
                        key={r}
                        onClick={() => setCreateForm((f) => ({ ...f, role: r }))}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selected
                            ? `${rm.border} ${rm.bg} ring-2 ring-offset-1 ring-indigo-300`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-xs font-bold uppercase tracking-wider ${selected ? rm.color : 'text-slate-400'}`}>
                          {rm.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">check</span>
                )}
                Tạo người dùng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Audit Log Full Modal ─────────────────────── */}
      {showAllLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAllLogs(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Nhật Ký Hoạt Động</h2>
                <p className="text-xs text-slate-400 mt-1">{logsTotal} bản ghi</p>
              </div>
              <button onClick={() => setShowAllLogs(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Filter tabs */}
            <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-2 shrink-0 overflow-x-auto">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'UPDATE', label: 'Cập nhật' },
                { key: 'STATUS_CHANGE', label: 'Trạng thái' },
                { key: 'CREATE', label: 'Tạo mới' },
                { key: 'DELETE', label: 'Xóa' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setLogsFilter(f.key); setLogsPage(1) }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                    logsFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Log list */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              {logsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : allLogs.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">receipt_long</span>
                  <p className="text-slate-400 text-sm">Không có nhật ký nào.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {allLogs.map((log) => {
                    const actionIcon: Record<string, { icon: string; bg: string }> = {
                      UPDATE: { icon: 'edit', bg: 'bg-indigo-100 text-indigo-600' },
                      STATUS_CHANGE: { icon: 'toggle_on', bg: 'bg-amber-100 text-amber-600' },
                      CREATE: { icon: 'person_add', bg: 'bg-emerald-100 text-emerald-600' },
                      DELETE: { icon: 'delete', bg: 'bg-red-100 text-red-600' },
                    }
                    const a = actionIcon[log.action] || { icon: 'info', bg: 'bg-slate-100 text-slate-600' }

                    return (
                      <div key={log._id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.bg}`}>
                          <span className="material-symbols-outlined text-lg">{a.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 leading-snug">{getAuditLabel(log)}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{timeAgo(log.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {logsTotalPages > 1 && (
              <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-400 font-bold">
                  Trang {logsPage} / {logsTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                    disabled={logsPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(logsTotalPages, 5) }, (_, i) => {
                    let page: number
                    if (logsTotalPages <= 5) {
                      page = i + 1
                    } else if (logsPage <= 3) {
                      page = i + 1
                    } else if (logsPage >= logsTotalPages - 2) {
                      page = logsTotalPages - 4 + i
                    } else {
                      page = logsPage - 2 + i
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setLogsPage(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          page === logsPage
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                    disabled={logsPage === logsTotalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminUsers
