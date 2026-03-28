import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import RichTextEditor, { RichTextEditorHandle } from '../../components/admin/RichTextEditor'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { errorToast, successToast } from '../../utils/toast'

const CATEGORIES = ['News', 'Review', 'Guide', 'Tutorial', 'Interview', 'Opinion', 'Video']

const NewsCreate: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAdminAuth()
  const editorRef = useRef<RichTextEditorHandle>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('News')
  const [featured, setFeatured] = useState(false)

  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Featured image
  const [featuredImage, setFeaturedImage] = useState<{ url: string; alt?: string } | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  // SEO
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')

  // ── Admin Fetch ──────────────────────────────────────────
  const adminFetch = useCallback(async (url: string, options?: RequestInit) => {
    let token = localStorage.getItem('adminToken')
    if (!token) throw new Error('No admin token found')

    const makeHeaders = (t: string): Record<string, string> => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
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

  // ── Upload image ─────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      errorToast('Ảnh không được vượt quá 5MB')
      return
    }
    try {
      const formData = new FormData()
      formData.append('images', file)
      const token = localStorage.getItem('adminToken') || ''
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Upload failed')
      if (json.data?.[0]?.url) {
        setFeaturedImage({ url: json.data[0].url, alt: title || 'Featured image' })
        successToast('Tải ảnh thành công')
      }
    } catch (err: any) {
      errorToast(err.message || 'Không thể tải ảnh')
    }
    e.target.value = ''
  }

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return
    setFeaturedImage({ url: imageUrl.trim(), alt: title || 'Featured image' })
    setImageUrl('')
  }

  // ── Tags ─────────────────────────────────────────────────
  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async (saveStatus: 'draft' | 'published') => {
    const htmlContent = editorRef.current?.getHtml() || content
    if (!title.trim()) { errorToast('Vui lòng nhập tiêu đề bài viết'); return }
    if (!htmlContent.trim() || htmlContent === '<p><br></p>') { errorToast('Vui lòng nhập nội dung bài viết'); return }
    if (!excerpt.trim()) { errorToast('Vui lòng nhập tóm tắt bài viết'); return }

    setIsSaving(true)
    try {
      const body: any = {
        title: title.trim(),
        content: htmlContent,
        excerpt: excerpt.trim(),
        category,
        tags,
        featured,
        status: saveStatus,
      }
      if (featuredImage) body.featuredImage = featuredImage
      if (seoTitle.trim()) body.seoTitle = seoTitle.trim()
      if (seoDescription.trim()) body.seoDescription = seoDescription.trim()

      await adminFetch('/api/news', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      successToast(saveStatus === 'published' ? 'Đã xuất bản bài viết' : 'Đã lưu bản nháp')
      navigate('/admin/news')
    } catch (err: any) {
      errorToast(err.message || 'Không thể tạo bài viết')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-8xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <AdminBreadcrumb items={[{ label: 'Tin Tức', href: '/admin/news' }, { label: 'Tạo bài viết' }]} />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">Tạo bài viết mới</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/news')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">draft</span>
              Lưu nháp
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              {isSaving ? 'Đang lưu...' : 'Xuất bản'}
            </button>
          </div>
        </div>

        {/* ── Two-Column Layout ──────────────────────── */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* ── Main Editor (col-span-8) ─────────────── */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* General Info Card */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-5">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="material-symbols-outlined text-indigo-600 text-xl">article</span>
                Thông tin chung
              </h3>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder:text-slate-300 transition-all"
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </div>
              {/* Category + Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nổi bật</label>
                  <button
                    onClick={() => setFeatured(!featured)}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all border ${
                      featured
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" style={featured ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      star
                    </span>
                    {featured ? 'Nổi bật' : 'Không nổi bật'}
                  </button>
                </div>
              </div>
              {/* Excerpt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tóm tắt</label>
                  <span className="text-[10px] text-slate-400">{excerpt.length}/500</span>
                </div>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder:text-slate-300 transition-all resize-y"
                  placeholder="Tóm tắt ngắn cho bài viết..."
                />
              </div>
              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung bài viết</label>
                <RichTextEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  placeholder="Viết nội dung bài viết tại đây..."
                  height="400px"
                />
              </div>
            </section>

            {/* SEO Card */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="material-symbols-outlined text-indigo-600 text-xl">search</span>
                SEO & Tối ưu tìm kiếm
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Meta Title</label>
                    <span className="text-[10px] text-slate-400">{seoTitle.length}/60</span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                    placeholder="Mặc định dùng tiêu đề bài viết"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Meta Description</label>
                    <span className="text-[10px] text-slate-400">{seoDescription.length}/160</span>
                  </div>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all resize-y"
                    placeholder="Mặc định dùng tóm tắt bài viết"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── Sidebar (col-span-4) ─────────────────── */}
          <div className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            {/* Publishing Panel */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-xl">send</span>
                  Xuất bản
                </h4>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-widest rounded-full">
                  Mới
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">visibility</span> Hiển thị
                  </span>
                  <span className="font-semibold text-indigo-600">Công khai</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">person</span> Tác giả
                  </span>
                  <span className="font-semibold text-slate-800">{user?.name || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSave('published')}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                >
                  {isSaving ? 'Đang lưu...' : 'Xuất bản'}
                </button>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 text-sm"
                >
                  Lưu nháp
                </button>
              </div>
            </section>

            {/* Featured Thumbnail */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-xl">image</span>
                Ảnh đại diện
              </h4>

              {featuredImage ? (
                <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={featuredImage.url}
                    alt={featuredImage.alt || ''}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setFeaturedImage(null)}
                      className="text-white text-sm font-semibold flex items-center gap-1.5 bg-red-500/80 px-3 py-1.5 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span> Xóa ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-lg h-36 hover:border-indigo-400 transition-all">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <span className="material-symbols-outlined text-3xl mb-1">cloud_upload</span>
                    <span className="text-sm font-semibold">Tải ảnh lên</span>
                    <span className="text-[10px] mt-0.5 text-slate-400">Khuyến nghị 1200 × 630 px</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}

              {!featuredImage && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                    placeholder="Hoặc dán URL ảnh..."
                  />
                  <button
                    onClick={handleAddImageUrl}
                    className="px-2.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}
            </section>

            {/* Tags */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-xl">sell</span>
                Tags
              </h4>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-semibold">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition-colors ml-0.5">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pr-9 text-xs outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                  placeholder="Nhập tag và nhấn Enter..."
                />
                <button
                  onClick={handleAddTag}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default NewsCreate
