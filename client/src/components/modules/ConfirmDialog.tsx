import { FC, ReactNode } from 'react'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import Button from '../atomic/Button'

type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string | ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  isLoading?: boolean
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null

  // Variant styles
  const iconStyles: Record<ConfirmVariant, string> = {
    danger: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }

  const confirmButtonVariant: Record<ConfirmVariant, 'primary' | 'secondary'> = {
    danger: 'primary',
    warning: 'primary',
    info: 'primary',
  }

  // Icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className={`w-12 h-12 ${iconStyles.danger}`} />
      case 'warning':
        return <AlertTriangle className={`w-12 h-12 ${iconStyles.warning}`} />
      case 'info':
        return <Info className={`w-12 h-12 ${iconStyles.info}`} />
      default:
        return <CheckCircle className={`w-12 h-12 ${iconStyles.danger}`} />
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onCancel}
        />
      )}

      {/* Dialog */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md transform transition-all ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              {getIcon()}
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">
                {title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {cancelText}
              </Button>
              <Button
                variant={confirmButtonVariant[variant]}
                size="md"
                onClick={onConfirm}
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmDialog
