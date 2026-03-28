import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import ActionMenu, { ActionMenuItem } from '../../components/admin/ActionMenu'
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal'
import { errorToast, successToast } from '../../utils/toast'

// ── Types ──────────────────────────────────────────────────
interface NewsArticle {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: { url: string; alt?: string }
  author: { _id: string; name: string; email: string; avatar?: string }
  category: string
  tags?: string[]
  featured: boolean
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  views: number
  readTime: number
  createdAt: string
  updatedAt: string
}

interface NewsStats {
  total: number
  published: number
  draft: number
  avgReadTime: number
}

// ── Constants ──────────────────────────────────────────────
const CATEGORIES = ['News', 'Review', 'Guide', 'Tutorial', 'Interview', 'Opinion', 'Video']

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  published: { label: 'Published', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  draft:     { label: 'Draft',     color: 'text-slate-500',   dot: 'bg-slate-400' },
  archived:  { label: 'Archived',  color: 'text-amber-600',   dot: 'bg-amber-500' },
}

// ── Helpers ────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

// ── Component ──────────────────────────────────────────────
const AdminNews: React.FC = () => {
  const navigate = useNavigate()

  // Data
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [stats, setStats] = useState<NewsStats>({ total: 0, published: 0, draft: 0, avgReadTime: 0 })
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)
  const LIMIT = 5

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Admin Fetch ──────────────────────────────────────────
  const adminFetch = useCallback(async (url: string, options?: RequestInit) => {
    let token = localStorage.getItem('adminToken')
    if (!token) throw new Error('No admin token found')

    const makeHeaders = (t: string) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
      ...options?.headers,
    })

    let res = await fetch(url, { ...options, headers: makeHeaders(token), credentials: 'include' })

    if (res.status === 401) {
      const refreshRes = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        const newToken = refreshData.data?.accessToken
        if (newToken) {
          localStorage.setItem('adminToken', newToken)
          res = await fetch(url, { ...options, headers: makeHeaders(newToken), credentials: 'include' })
        }
      }
    }

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Request failed')
    return json
  }, [])

  // ── Fetch Articles ───────────────────────────────────────
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(LIMIT),
        sort: sortBy,
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const json = await adminFetch(`/api/news/admin/all?${params}`)
      const data: NewsArticle[] = json.data || []

      // Client-side category filter (API doesn't support it for admin)
      const filtered = categoryFilter !== 'all'
        ? data.filter((a) => a.category === categoryFilter)
        : data

      setArticles(filtered)
      setTotalPages(json.pagination?.pages || 1)
      setTotalArticles(json.pagination?.total || 0)
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải bài viết')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, searchQuery, sortBy, categoryFilter, adminFetch])

  // ── Compute Stats ────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const json = await adminFetch('/api/news/admin/all?limit=9999')
      const all: NewsArticle[] = json.data || []
      const published = all.filter((a) => a.status === 'published').length
      const draft = all.filter((a) => a.status === 'draft').length
      const avgRead = all.length > 0 ? +(all.reduce((s, a) => s + a.readTime, 0) / all.length).toFixed(1) : 0
      setStats({ total: all.length, published, draft, avgReadTime: avgRead })
    } catch {
      // silent
    }
  }, [adminFetch])

  // ── Debounce search ──────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { fetchArticles() }, [fetchArticles])
  useEffect(() => { fetchStats() }, [fetchStats])

  // ── Handlers ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await adminFetch(`/api/news/admin/${deleteTarget._id}`, { method: 'DELETE' })
      successToast('Đã xóa bài viết')
      setDeleteTarget(null)
      fetchArticles()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể xóa bài viết')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePublish = async (article: NewsArticle) => {
    const isPublished = article.status === 'published'
    try {
      await adminFetch(`/api/news/admin/${article._id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ published: !isPublished }),
      })
      successToast(isPublished ? 'Đã chuyển về bản nháp' : 'Đã xuất bản bài viết')
      fetchArticles()
      fetchStats()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleToggleFeatured = async (article: NewsArticle) => {
    try {
      await adminFetch(`/api/news/admin/${article._id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: !article.featured }),
      })
      successToast(article.featured ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật')
      fetchArticles()
    } catch (err: any) {
      errorToast(err.message || 'Không thể cập nhật')
    }
  }

  // ── Row Actions ──────────────────────────────────────────
  const getRowActions = (article: NewsArticle): ActionMenuItem[] => {
    const isPublished = article.status === 'published'
    return [
      {
        icon: 'edit',
        label: 'Chỉnh sửa',
        color: 'indigo',
        onClick: () => navigate(`/admin/news/${article._id}`),
      },
      {
        icon: isPublished ? 'unpublished' : 'publish',
        label: isPublished ? 'Chuyển nháp' : 'Xuất bản',
        color: 'default',
        onClick: () => handleTogglePublish(article),
      },
      {
        icon: article.featured ? 'star' : 'star_border',
        label: article.featured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật',
        color: 'default',
        onClick: () => handleToggleFeatured(article),
      },
      {
        icon: 'delete',
        label: 'Xóa bài viết',
        color: 'red',
        onClick: () => setDeleteTarget(article),
      },
    ]
  }

  // ── Unique categories from data ──────────────────────────
  const statusTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'published', label: 'Đã xuất bản' },
    { key: 'draft', label: 'Bản nháp' },
    { key: 'archived', label: 'Lưu trữ' },
  ]

  return (
    <AdminLayout>
      {/* ── Editorial Header ─────────────────────────── */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <AdminBreadcrumb items={[{ label: 'Quản Lý Tin Tức' }]} />
          <span className="text-xs uppercase tracking-[0.15em] text-indigo-600 font-bold mb-2 block mt-3">Content Studio</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Blog Management</h1>
          <p className="text-slate-500 mt-2 max-w-md">
            Lưu trữ và biên tập các nội dung tin tức, đánh giá phần cứng và tin tức eSports mới nhất cho Voltrix.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/news/create')}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm Bài Viết
        </button>
      </section>

      {/* ── Stats Bento Grid ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Articles', value: stats.total, sub: null, subColor: '', borderColor: 'border-indigo-500' },
          { label: 'Published', value: stats.published, sub: stats.total > 0 ? `${Math.round((stats.published / stats.total) * 100)}%` : '0%', subColor: 'text-indigo-600', borderColor: 'border-emerald-400' },
          { label: 'Drafts', value: stats.draft, sub: 'Pending', subColor: 'text-slate-500', borderColor: 'border-amber-400' },
          { label: 'Avg Read Time', value: `${stats.avgReadTime}m`, sub: stats.avgReadTime > 4 ? 'High' : 'Normal', subColor: stats.avgReadTime > 4 ? 'text-indigo-600' : 'text-slate-500', borderColor: 'border-slate-300' },
        ].map((card) => (
          <div key={card.label} className={`p-6 bg-white rounded-xl border-l-4 ${card.borderColor} shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5`}>
            <span className="uppercase tracking-widest text-slate-400 text-[10px] font-bold">{card.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</span>
              {card.sub && <span className={`text-xs font-bold ${card.subColor}`}>{card.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Table ──────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Controls */}
        <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status filter pills */}
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  statusFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
              className="px-3 py-2 rounded-xl bg-slate-50 border-none text-xs font-bold text-slate-600 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none  focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm w-56"
                placeholder="Tìm bài viết..."
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1) }}
                className="bg-slate-50 w-40 px-2 py-2 border text-slate-600 border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="recent">Cập nhật gần đây</option>
                <span className="material-symbols-outlined absolute right-3 top-10 text-slate-400 pointer-events-none">
              expand_more
            </span>
              </select>
               
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-24">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">article</span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy bài viết</h3>
              <p className="text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Thumbnail & Title</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Author</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((article) => {
                  const st = STATUS_MAP[article.status] || STATUS_MAP.draft
                  return (
                    <tr key={article._id} className="group hover:bg-slate-50 transition-colors h-20">
                      {/* Thumbnail & Title */}
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                            {article.featuredImage?.url ? (
                              <img
                                src={article.featuredImage.url}
                                alt={article.featuredImage.alt || article.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p
                                onClick={() => navigate(`/admin/news/${article._id}`)}
                                className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate cursor-pointer"
                              >                                {article.title}
                              </p>
                              {article.featured && (
                                <span className="material-symbols-outlined text-amber-400 text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">{timeAgo(article.updatedAt)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-full">
                          {article.category}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {article.author?.avatar ? (
                            <img src={article.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                              {article.author?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                            {article.author?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(article.publishedAt || article.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className={`text-xs font-bold ${st.color}`}>{st.label}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-4 text-right">
                        <ActionMenu items={getRowActions(article)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-6 flex items-center justify-between border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs font-medium text-slate-400">
              Hiển thị {(currentPage - 1) * LIMIT + 1} - {Math.min(currentPage * LIMIT, totalArticles)} trên {totalArticles.toLocaleString()} bài viết
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="mx-1 text-slate-400 text-xs">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-600"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Secondary Insights ───────────────────────── */}
      <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Draft Optimization */}
        <div className="lg:col-span-2 bg-slate-50 p-8 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Draft Optimization</h3>
            <p className="text-sm text-slate-500 max-w-lg mb-6 leading-relaxed">
              {stats.draft > 0
                ? `Bạn có ${stats.draft} bản nháp chưa hoàn thiện. Cân nhắc lưu trữ hoặc lên lịch đăng bài để duy trì lưu lượng truy cập ổn định.`
                : 'Tất cả bài viết đã được xuất bản hoặc lưu trữ. Tuyệt vời!'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => { setStatusFilter('draft'); setCurrentPage(1) }}
                className="px-5 py-2.5 bg-white font-bold text-xs rounded-xl hover:shadow-md transition-all border border-slate-200"
              >
                Review Drafts
              </button>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-100/50 rounded-full blur-3xl" />
          <div className="absolute right-8 top-8 opacity-10">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
          </div>
        </div>

        {/* AI Content Card */}
        <div className="bg-indigo-600 text-white p-8 rounded-xl flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-4xl mb-4 block">auto_awesome</span>
            <h3 className="text-xl font-extrabold mb-2">AI Content Assistant</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Hãy để AI giúp bạn tối ưu hóa SEO và tiêu đề cho bài viết mới nhất của mình.
            </p>
          </div>
          <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all">
            Try Optimizer
          </button>
        </div>
      </section>

      {/* ── Delete Modal ─────────────────────────────── */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        productName={deleteTarget?.title}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  )
}

export default AdminNews
