import React, { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────
interface PopulatedItem {
  _id: string
  name: string
}

interface PopulatedUser {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface PromotionData {
  _id?: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxDiscount?: number
  minOrderValue?: number
  applicableProducts?: any[]
  applicableCategories?: any[]
  applicablePlatforms?: any[]
  excludeProducts?: any[]
  usageLimit: number
  usedCount?: number
  usagePerUser?: number
  usedByUsers?: PopulatedUser[]
  badge?: string
  applicableToNewMembersOnly?: boolean
  startDate: string
  endDate: string
  isActive: boolean
  description?: string
  conditions?: string[]
  computedStatus?: 'active' | 'expired' | 'scheduled'
  createdAt?: string
  updatedAt?: string
}

interface PromotionModalProps {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  promotion?: PromotionData | null
  onClose: () => void
  onSave: (data: Partial<PromotionData>) => Promise<void>
}

// ── Constants ──────────────────────────────────────────────
const BADGES = [
  { key: '', label: 'Không có' },
  { key: 'NEW_MEMBER', label: 'Thành viên mới' },
  { key: 'HOT', label: 'Hot' },
  { key: 'FLASH_SALE', label: 'Flash Sale' },
  { key: 'PREMIUM', label: 'Premium' },
  { key: 'UNLIMITED', label: 'Unlimited' },
]

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  active:    { label: 'Active',    bg: 'bg-emerald-50', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  expired:   { label: 'Expired',   bg: 'bg-slate-100',  color: 'text-slate-500',   dot: 'bg-slate-400' },
  scheduled: { label: 'Scheduled', bg: 'bg-amber-50',   color: 'text-amber-600',   dot: 'bg-amber-500' },
}

// ── Helpers ────────────────────────────────────────────────
const toLocalDate = (d: string) => {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 16)
}

const formatDateDisplay = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatValue = (type: string, value: number) =>
  type === 'percentage' ? `${value}%` : `${value.toLocaleString('vi-VN')}₫`

// ── Component ──────────────────────────────────────────────
const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, mode, promotion, onClose, onSave }) => {
  const [saving, setSaving] = useState(false)
  const [conditionInput, setConditionInput] = useState('')
  const [localMode, setLocalMode] = useState(mode)

  // Options for scope selects
  const [productOptions, setProductOptions] = useState<PopulatedItem[]>([])
  const [categoryOptions, setCategoryOptions] = useState<PopulatedItem[]>([])
  const [platformOptions, setPlatformOptions] = useState<PopulatedItem[]>([])

  // Form state
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    maxDiscount: 0,
    minOrderValue: 0,
    usageLimit: 100,
    usagePerUser: 1,
    badge: '',
    applicableToNewMembersOnly: false,
    startDate: '',
    endDate: '',
    isActive: true,
    description: '',
    conditions: [] as string[],
    applicableProducts: [] as PopulatedItem[],
    applicableCategories: [] as PopulatedItem[],
    applicablePlatforms: [] as PopulatedItem[],
    excludeProducts: [] as PopulatedItem[],
  })

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return
    setLocalMode(mode)
    if (promotion && (mode === 'edit' || mode === 'view')) {
      setForm({
        code: promotion.code || '',
        type: promotion.type || 'percentage',
        value: promotion.value || 0,
        maxDiscount: promotion.maxDiscount || 0,
        minOrderValue: promotion.minOrderValue || 0,
        usageLimit: promotion.usageLimit || 100,
        usagePerUser: promotion.usagePerUser || 1,
        badge: promotion.badge || '',
        applicableToNewMembersOnly: promotion.applicableToNewMembersOnly || false,
        startDate: toLocalDate(promotion.startDate),
        endDate: toLocalDate(promotion.endDate),
        isActive: promotion.isActive ?? true,
        description: promotion.description || '',
        conditions: promotion.conditions || [],
        applicableProducts: (promotion.applicableProducts || []).map((p: any) => ({ _id: p._id || p, name: p.name || '' })),
        applicableCategories: (promotion.applicableCategories || []).map((c: any) => ({ _id: c._id || c, name: c.name || '' })),
        applicablePlatforms: (promotion.applicablePlatforms || []).map((p: any) => ({ _id: p._id || p, name: p.name || '' })),
        excludeProducts: (promotion.excludeProducts || []).map((p: any) => ({ _id: p._id || p, name: p.name || '' })),
      })
    } else {
      // Default for create
      const now = new Date()
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setForm({
        code: '',
        type: 'percentage',
        value: 0,
        maxDiscount: 0,
        minOrderValue: 0,
        usageLimit: 100,
        usagePerUser: 1,
        badge: '',
        applicableToNewMembersOnly: false,
        startDate: now.toISOString().slice(0, 16),
        endDate: nextMonth.toISOString().slice(0, 16),
        isActive: true,
        description: '',
        conditions: [],
        applicableProducts: [],
        applicableCategories: [],
        applicablePlatforms: [],
        excludeProducts: [],
      })
    }
    setConditionInput('')
  }, [isOpen, promotion, mode])

  // Fetch options for scope selects
  useEffect(() => {
    if (!isOpen) return
    const fetchOptions = async () => {
      const token = localStorage.getItem('adminToken')
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [prodRes, catRes, platRes] = await Promise.all([
          fetch('/api/products?limit=200', { headers }),
          fetch('/api/categories', { headers }),
          fetch('/api/platforms', { headers }),
        ])
        const [prodData, catData, platData] = await Promise.all([
          prodRes.json(), catRes.json(), platRes.json(),
        ])
        if (prodData.data) setProductOptions((prodData.data.products || prodData.data || []).map((p: any) => ({ _id: p._id, name: p.name })))
        if (catData.data) setCategoryOptions((Array.isArray(catData.data) ? catData.data : []).map((c: any) => ({ _id: c._id, name: c.name })))
        if (platData.data) setPlatformOptions((Array.isArray(platData.data) ? platData.data : []).map((p: any) => ({ _id: p._id, name: p.name })))
      } catch (err) {
        console.error('Failed to fetch scope options:', err)
      }
    }
    fetchOptions()
  }, [isOpen])

  const updateField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  const handleAddCondition = () => {
    const c = conditionInput.trim()
    if (!c || form.conditions.includes(c)) return
    updateField('conditions', [...form.conditions, c])
    setConditionInput('')
  }

  const handleRemoveCondition = (idx: number) => {
    updateField('conditions', form.conditions.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!form.code.trim()) return
    if (form.value <= 0) return
    if (!form.startDate || !form.endDate) return

    setSaving(true)
    try {
      await onSave({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.value,
        maxDiscount: form.maxDiscount || undefined,
        minOrderValue: form.minOrderValue || undefined,
        usageLimit: form.usageLimit,
        usagePerUser: form.usagePerUser,
        badge: form.badge || undefined,
        applicableToNewMembersOnly: form.applicableToNewMembersOnly,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
        description: form.description.trim() || undefined,
        conditions: form.conditions.length > 0 ? form.conditions : undefined,
        applicableProducts: form.applicableProducts.map(p => p._id),
        applicableCategories: form.applicableCategories.map(c => c._id),
        applicablePlatforms: form.applicablePlatforms.map(p => p._id),
        excludeProducts: form.excludeProducts.map(p => p._id),
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const isView = localMode === 'view'
  const statusInfo = promotion?.computedStatus ? STATUS_MAP[promotion.computedStatus] : null

  // Input classes
  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all disabled:bg-slate-50 disabled:text-slate-500'
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <span className="material-symbols-outlined text-indigo-600 text-xl">
                {mode === 'create' ? 'add_circle' : mode === 'edit' ? 'edit' : 'visibility'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {localMode === 'create' ? 'Tạo khuyến mãi mới' : localMode === 'edit' ? 'Chỉnh sửa khuyến mãi' : 'Chi tiết khuyến mãi'}
              </h2>
              {isView && promotion && (
                <span className="font-mono text-sm text-indigo-600 font-bold">{promotion.code}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isView && statusInfo && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${statusInfo.bg} ${statusInfo.color} text-[10px] uppercase font-bold tracking-widest rounded-full`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* View mode: info grid */}
          {isView && promotion ? (
            <div className="space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Giá trị</p>
                  <p className="text-2xl font-extrabold text-slate-900">{formatValue(promotion.type, promotion.value)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{promotion.type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Đã sử dụng</p>
                  <p className="text-2xl font-extrabold text-slate-900">{(promotion.usedCount || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">/ {promotion.usageLimit.toLocaleString()} lượt</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Mỗi người</p>
                  <p className="text-2xl font-extrabold text-slate-900">{promotion.usagePerUser || 1}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">lượt / user</p>
                </div>
              </div>

              {/* Usage bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-semibold">
                  <span>Tiến độ sử dụng</span>
                  <span>{Math.round(((promotion.usedCount || 0) / promotion.usageLimit) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(promotion.usedCount || 0) >= promotion.usageLimit ? 'bg-slate-400' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(100, Math.round(((promotion.usedCount || 0) / promotion.usageLimit) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-4">
                {promotion.maxDiscount ? (
                  <InfoRow icon="vertical_align_top" label="Giảm tối đa" value={`${promotion.maxDiscount.toLocaleString('vi-VN')}₫`} />
                ) : null}
                {promotion.minOrderValue ? (
                  <InfoRow icon="shopping_cart" label="Đơn tối thiểu" value={`${promotion.minOrderValue.toLocaleString('vi-VN')}₫`} />
                ) : null}
                <InfoRow icon="event" label="Bắt đầu" value={formatDateDisplay(promotion.startDate)} />
                <InfoRow icon="event_busy" label="Kết thúc" value={formatDateDisplay(promotion.endDate)} />
                {promotion.badge && (
                  <InfoRow icon="verified" label="Badge" value={BADGES.find(b => b.key === promotion.badge)?.label || promotion.badge} />
                )}
                {promotion.applicableToNewMembersOnly && (
                  <InfoRow icon="person_add" label="Đối tượng" value="Chỉ thành viên mới" />
                )}
              </div>

              {/* Description */}
              {promotion.description && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mô tả</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{promotion.description}</p>
                </div>
              )}

              {/* Conditions */}
              {promotion.conditions && promotion.conditions.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Điều kiện</p>
                  <ul className="space-y-1.5">
                    {promotion.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="material-symbols-outlined text-indigo-500 text-sm mt-0.5">check_circle</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scope: applicable items */}
              {(promotion.applicableProducts?.length || promotion.applicableCategories?.length || promotion.applicablePlatforms?.length || promotion.excludeProducts?.length) ? (
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">tune</span>
                    Phạm vi áp dụng
                  </p>
                  {promotion.applicableProducts && promotion.applicableProducts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sản phẩm</p>
                      <div className="flex flex-wrap gap-1.5">
                        {promotion.applicableProducts.map((p: any) => (
                          <span key={p._id || p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium">
                            <span className="material-symbols-outlined text-[12px] text-indigo-500">inventory_2</span>
                            {p.name || p._id || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {promotion.applicableCategories && promotion.applicableCategories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Danh mục</p>
                      <div className="flex flex-wrap gap-1.5">
                        {promotion.applicableCategories.map((c: any) => (
                          <span key={c._id || c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium">
                            <span className="material-symbols-outlined text-[12px] text-amber-500">category</span>
                            {c.name || c._id || c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {promotion.applicablePlatforms && promotion.applicablePlatforms.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nền tảng</p>
                      <div className="flex flex-wrap gap-1.5">
                        {promotion.applicablePlatforms.map((p: any) => (
                          <span key={p._id || p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium">
                            <span className="material-symbols-outlined text-[12px] text-emerald-500">sports_esports</span>
                            {p.name || p._id || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {promotion.excludeProducts && promotion.excludeProducts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Loại trừ sản phẩm</p>
                      <div className="flex flex-wrap gap-1.5">
                        {promotion.excludeProducts.map((p: any) => (
                          <span key={p._id || p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-red-200 rounded text-xs text-red-600 font-medium">
                            <span className="material-symbols-outlined text-[12px]">block</span>
                            {p.name || p._id || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Used By Users */}
              {promotion.usedByUsers && promotion.usedByUsers.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">group</span>
                    Người đã sử dụng ({promotion.usedByUsers.length})
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {promotion.usedByUsers.map((u: any) => (
                      <div key={u._id || u} className="flex items-center gap-2 text-sm text-slate-700">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name || 'N/A'}</span>
                        {u.email && <span className="text-slate-400 text-xs">({u.email})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              {(promotion.createdAt || promotion.updatedAt) && (
                <div className="flex gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  {promotion.createdAt && <span>Tạo: {formatDateDisplay(promotion.createdAt)}</span>}
                  {promotion.updatedAt && <span>Cập nhật: {formatDateDisplay(promotion.updatedAt)}</span>}
                </div>
              )}
            </div>
          ) : (
            /* Create/Edit form */
            <div className="space-y-5">
              {/* Row 1: Code + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Mã khuyến mãi *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                    className={`${inputCls} font-mono font-bold tracking-wider`}
                    placeholder="VD: SUMMER24"
                    maxLength={20}
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className={labelCls}>Loại giảm giá *</label>
                  <select
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className={inputCls}
                    disabled={isView}
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (₫)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Value + Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Giá trị giảm *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.value || ''}
                      onChange={(e) => updateField('value', Number(e.target.value))}
                      className={inputCls}
                      placeholder={form.type === 'percentage' ? 'VD: 20' : 'VD: 50000'}
                      min={0}
                      max={form.type === 'percentage' ? 100 : undefined}
                      disabled={isView}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                      {form.type === 'percentage' ? '%' : '₫'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Giảm tối đa {form.type === 'percentage' ? '(₫)' : ''}</label>
                  <input
                    type="number"
                    value={form.maxDiscount || ''}
                    onChange={(e) => updateField('maxDiscount', Number(e.target.value))}
                    className={inputCls}
                    placeholder="Không giới hạn"
                    min={0}
                    disabled={isView}
                  />
                </div>
              </div>

              {/* Row 3: Min Order + Usage Limit */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Đơn tối thiểu (₫)</label>
                  <input
                    type="number"
                    value={form.minOrderValue || ''}
                    onChange={(e) => updateField('minOrderValue', Number(e.target.value))}
                    className={inputCls}
                    placeholder="0"
                    min={0}
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className={labelCls}>Giới hạn sử dụng</label>
                  <input
                    type="number"
                    value={form.usageLimit || ''}
                    onChange={(e) => updateField('usageLimit', Number(e.target.value))}
                    className={inputCls}
                    placeholder="100"
                    min={1}
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tối đa / user</label>
                  <input
                    type="number"
                    value={form.usagePerUser || ''}
                    onChange={(e) => updateField('usagePerUser', Number(e.target.value))}
                    className={inputCls}
                    placeholder="1"
                    min={1}
                    disabled={isView}
                  />
                </div>
              </div>

              {/* Row 4: Start + End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className={inputCls}
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className={labelCls}>Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className={inputCls}
                    disabled={isView}
                  />
                </div>
              </div>

              {/* Row 5: Badge + New Member + Active */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Badge</label>
                  <select
                    value={form.badge}
                    onChange={(e) => updateField('badge', e.target.value)}
                    className={inputCls}
                    disabled={isView}
                  >
                    {BADGES.map(b => (
                      <option key={b.key} value={b.key}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Thành viên mới</label>
                  <button
                    type="button"
                    onClick={() => !isView && updateField('applicableToNewMembersOnly', !form.applicableToNewMembersOnly)}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all border ${
                      form.applicableToNewMembersOnly
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                    } ${isView ? 'cursor-default' : ''}`}
                    disabled={isView}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {form.applicableToNewMembersOnly ? 'check_circle' : 'cancel'}
                    </span>
                    {form.applicableToNewMembersOnly ? 'Bật' : 'Tắt'}
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Trạng thái</label>
                  <button
                    type="button"
                    onClick={() => !isView && updateField('isActive', !form.isActive)}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all border ${
                      form.isActive
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                    } ${isView ? 'cursor-default' : ''}`}
                    disabled={isView}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {form.isActive ? 'toggle_on' : 'toggle_off'}
                    </span>
                    {form.isActive ? 'Hoạt động' : 'Tắt'}
                  </button>
                </div>
              </div>

              {/* Scope Section */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">tune</span>
                  Phạm vi áp dụng
                  <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">— Để trống = tất cả</span>
                </p>

                <div className="space-y-4">
                  <ScopeSelect
                    label="Sản phẩm áp dụng"
                    icon="inventory_2"
                    iconColor="text-indigo-500"
                    selected={form.applicableProducts}
                    options={productOptions}
                    onAdd={(item) => updateField('applicableProducts', [...form.applicableProducts, item])}
                    onRemove={(id) => updateField('applicableProducts', form.applicableProducts.filter(p => p._id !== id))}
                    inputCls={inputCls}
                  />
                  <ScopeSelect
                    label="Danh mục áp dụng"
                    icon="category"
                    iconColor="text-amber-500"
                    selected={form.applicableCategories}
                    options={categoryOptions}
                    onAdd={(item) => updateField('applicableCategories', [...form.applicableCategories, item])}
                    onRemove={(id) => updateField('applicableCategories', form.applicableCategories.filter(c => c._id !== id))}
                    inputCls={inputCls}
                  />
                  <ScopeSelect
                    label="Nền tảng áp dụng"
                    icon="sports_esports"
                    iconColor="text-emerald-500"
                    selected={form.applicablePlatforms}
                    options={platformOptions}
                    onAdd={(item) => updateField('applicablePlatforms', [...form.applicablePlatforms, item])}
                    onRemove={(id) => updateField('applicablePlatforms', form.applicablePlatforms.filter(p => p._id !== id))}
                    inputCls={inputCls}
                  />
                  <ScopeSelect
                    label="Loại trừ sản phẩm"
                    icon="block"
                    iconColor="text-red-500"
                    selected={form.excludeProducts}
                    options={productOptions}
                    onAdd={(item) => updateField('excludeProducts', [...form.excludeProducts, item])}
                    onRemove={(id) => updateField('excludeProducts', form.excludeProducts.filter(p => p._id !== id))}
                    inputCls={inputCls}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={`${inputCls} resize-y`}
                  rows={2}
                  placeholder="Mô tả ngắn về khuyến mãi..."
                  disabled={isView}
                />
              </div>

              {/* Conditions */}
              <div>
                <label className={labelCls}>Điều kiện áp dụng</label>
                {form.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.conditions.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-semibold">
                        {c}
                        {!isView && (
                          <button onClick={() => handleRemoveCondition(i)} className="hover:text-red-500 transition-colors ml-0.5">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {!isView && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={conditionInput}
                      onChange={(e) => setConditionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                      className={`flex-1 ${inputCls}`}
                      placeholder="Nhập điều kiện và nhấn Enter..."
                    />
                    <button
                      onClick={handleAddCondition}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          {isView ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-all text-sm"
              >
                Đóng
              </button>
              <button
                onClick={() => setLocalMode('edit')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-sm"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={saving}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.code.trim() || form.value <= 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                <span className="material-symbols-outlined text-lg">
                  {localMode === 'create' ? 'add_circle' : 'save'}
                </span>
                {saving ? 'Đang lưu...' : localMode === 'create' ? 'Tạo khuyến mãi' : 'Lưu thay đổi'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Info Row (view mode) ───────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
    <span className="material-symbols-outlined text-indigo-500 text-lg">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
  </div>
)

// ── Scope Multi-Select (create/edit mode) ──────────────────
const ScopeSelect = ({
  label, icon, iconColor, selected, options, onAdd, onRemove, inputCls,
}: {
  label: string
  icon: string
  iconColor: string
  selected: PopulatedItem[]
  options: PopulatedItem[]
  onAdd: (item: PopulatedItem) => void
  onRemove: (id: string) => void
  inputCls: string
}) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = options.filter(
    o => !selected.some(s => s._id === o._id) && o.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
        <span className={`material-symbols-outlined text-[12px] ${iconColor}`}>{icon}</span>
        {label}
        {selected.length > 0 && <span className="text-indigo-500">({selected.length})</span>}
      </p>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(item => (
            <span key={item._id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">
              {item.name}
              <button onClick={() => onRemove(item._id)} className="hover:text-red-500 transition-colors ml-0.5">
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className={inputCls}
          placeholder={`Tìm ${label.toLowerCase()}...`}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filtered.slice(0, 20).map(item => (
              <button
                key={item._id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onAdd(item); setSearch('') }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
              >
                <span className={`material-symbols-outlined text-[14px] ${iconColor}`}>{icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PromotionModal
