import React from 'react'

export interface DeleteConfirmationModalProps {
  isOpen: boolean
  productName?: string
  productCount?: number
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
  isBulkDelete?: boolean
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  productName,
  productCount,
  onConfirm,
  onCancel,
  isDeleting,
  isBulkDelete = false,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-8">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <span className="material-symbols-outlined text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <h3 className="text-lg font-bold text-center text-slate-900 mb-2">
            {isBulkDelete ? 'Xóa Các Sản Phẩm?' : 'Xóa Sản Phẩm?'}
          </h3>
          <p className="text-center text-slate-600 text-sm mb-6">
            {isBulkDelete ? (
              <>
                Bạn có chắc chắn muốn xóa <span className="font-semibold">{productCount} sản phẩm</span> đã chọn?
                Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                Bạn có chắc chắn muốn xóa sản phẩm <span className="font-semibold">"{productName}"</span>?
                Hành động này không thể hoàn tác.
              </>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
