import React from 'react'
import { ProductVariant } from './VariantManagementModal'

interface EditVariantModalProps {
  isOpen: boolean
  isAddMode?: boolean
  variantModal: {
    isOpen: boolean
    index: number | null
    data: ProductVariant | null
    available?: number
  }
  formatVND: (price: number) => string
  onClose: () => void
  onSave: () => void
  onVariantChange: (field: string, value: any) => void
  onAvailableChange: (value: number) => void
  onImageFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (idx: number) => void
  onAddAttribute?: () => void
  onRemoveAttribute: (key: string) => void
  onAttributeChange: (oldKey: string, newKey: string, value: string) => void
}

const EditVariantModal: React.FC<EditVariantModalProps> = ({
  isOpen,
  isAddMode = false,
  variantModal,
  formatVND,
  onClose,
  onSave,
  onVariantChange,
  onAvailableChange,
  onImageFileUpload,
  onRemoveImage,
  onAddAttribute,
  onRemoveAttribute,
  onAttributeChange,
}) => {
  if (!isOpen || !variantModal.data) return null

  // Type-safe wrapper
  const handleVariantChange = (field: keyof ProductVariant, value: any) => {
    onVariantChange(field as string, value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {isAddMode ? 'Add New Variant' : 'Edit Variant Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Variant Name & SKU Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                Variant Name
              </label>
              <input
                type="text"
                value={variantModal.data.name}
                onChange={(e) => handleVariantChange('name', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                placeholder="e.g. Asia, EU, US"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={variantModal.data.sku}
                onChange={(e) => handleVariantChange('sku', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono"
                placeholder="Product variant SKU"
              />
            </div>
          </div>

          {/* Price & Cost Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                Price (₫)
              </label>
              <input
                type="number"
                value={variantModal.data.price || ''}
                onChange={(e) => handleVariantChange('price', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                Cost (₫)
              </label>
              <input
                type="number"
                value={variantModal.data.cost || ''}
                onChange={(e) => handleVariantChange('cost', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
                Discount (%)
              </label>
              <input
                type="number"
                value={variantModal.data.discount || ''}
                onChange={(e) => handleVariantChange('discount', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Final Price Display */}
          <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">Final Price</p>
            <p className="text-lg font-bold text-indigo-600">{formatVND(variantModal.data.finalPrice)}</p>
          </div>

          {/* Available Stock - Editable */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
              Available Stock
            </label>
            <input
              type="number"
              value={variantModal.available || ''}
              onChange={(e) => onAvailableChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              min="0"
            />
            <p className="text-xs text-emerald-600 mt-1">Managed in Inventory</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
              Status
            </label>
            <select
              value={variantModal.data.status}
              onChange={(e) => handleVariantChange('status', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          {/* Variant Images */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
              Variant Images
            </label>
            {variantModal.data.images && variantModal.data.images.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {variantModal.data.images?.map((img: any, idx: number) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.url}
                        alt={img.alt || 'Variant'}
                        className="w-full h-24 object-cover rounded-lg border border-slate-300"
                      />
                      <button
                        onClick={() => onRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No images uploaded
              </div>
            )}
            <div className="mt-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0
                  file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-600
                  hover:file:bg-indigo-200"
              />
            </div>
          </div>

          {/* Attributes - Editable */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-600">
                Attributes (Optional)
              </label>
              {isAddMode && (
                <button
                  onClick={onAddAttribute}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-200 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add
                </button>
              )}
            </div>
            {variantModal.data.attributes && Object.keys(variantModal.data.attributes).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(variantModal.data.attributes).map(([key, value]: [string, any], idx: number) => (
                  <div key={idx} className="flex gap-2 items-end">
                    {isAddMode ? (
                      <>
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => onAttributeChange(key, e.target.value, value as string)}
                          placeholder="Key (e.g. version, color)"
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                        />
                      </>
                    ) : (
                      <div className="px-3 py-2 bg-indigo-100 border border-indigo-300 rounded-lg min-w-fit">
                        <p className="text-sm font-semibold text-indigo-700">{key}</p>
                      </div>
                    )}
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => onAttributeChange(key, key, e.target.value)}
                      placeholder="Value (e.g. Asia, Black)"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    />
                    <button
                      onClick={() => onRemoveAttribute(key)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No attributes defined
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">close</span>
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isAddMode ? 'add_circle' : 'check_circle'}
            </span>
            {isAddMode ? 'Add Variant' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditVariantModal
