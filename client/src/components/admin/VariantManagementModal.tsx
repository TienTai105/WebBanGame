import React from 'react'

export interface ProductVariant {
  sku: string
  name: string
  attributes?: Record<string, any>
  images?: Array<{ url: string; cloudinaryId?: string; alt?: string; isMain?: boolean }>
  price: number
  cost?: number
  discount: number
  finalPrice: number
  stock?: number
  status: 'active' | 'inactive' | 'discontinued'
}

interface VariantManagementModalProps {
  isOpen: boolean
  productName: string
  variants: ProductVariant[]
  onClose: () => void
}

const VariantManagementModal: React.FC<VariantManagementModalProps> = ({
  isOpen,
  productName,
  variants,
  onClose,
}) => {
  if (!isOpen) return null

  const totalVariantStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)
  const totalVariantValue = variants.reduce(
    (sum, v) => sum + ((v.finalPrice || v.price) * (v.stock || 0)),
    0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Quản Lý Variant</h2>
            <p className="text-sm text-slate-600 mt-1">
              Sản phẩm: <span className="font-semibold">{productName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-2">Tổng Variant</p>
              <p className="text-3xl font-bold text-indigo-900">{variants.length}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-2">Tổng Tồn Kho</p>
              <p className="text-3xl font-bold text-emerald-900">{totalVariantStock}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-2">Giá Trị Tồn Kho</p>
              <p className="text-xl font-bold text-blue-900 break-words">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(totalVariantValue)}
              </p>
            </div>
          </div>

          {/* Variants Table */}
          {variants.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">
                inventory_2
              </span>
              <p className="text-slate-500 font-medium">Không có variant nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-600">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-600">
                      Tên Variant
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-600">
                      Attributes
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold text-slate-600">
                      Giá
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold text-slate-600">
                      Tồn Kho
                    </th>
                    <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-bold text-slate-600">
                      Trạng Thái
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold text-slate-600">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.map((variant, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-all">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{variant.sku}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {variant.name || `Variant ${index + 1}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {variant.attributes
                          ? Object.entries(variant.attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(variant.finalPrice || variant.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">{variant.stock || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            variant.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : variant.status === 'inactive'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {variant.status === 'active'
                            ? 'Hoạt động'
                            : variant.status === 'inactive'
                              ? 'Không hoạt động'
                              : 'Ngừng kinh doanh'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs p-1 hover:bg-indigo-50 rounded transition-all">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-all"
          >
            Đóng
          </button>
          <button className="px-6 py-2.5 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm Variant
          </button>
        </div>
      </div>
    </div>
  )
}

export default VariantManagementModal
