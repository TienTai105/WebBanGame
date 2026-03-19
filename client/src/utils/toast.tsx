import { FC, ReactNode } from 'react'
import { toast, ToastOptions } from 'react-toastify'
import { Check, X, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastParams {
  message: string | ReactNode
  type?: ToastType
  duration?: number
  title?: string
}

// Custom toast UI component
const ToastContent: FC<{
  type: ToastType
  title?: string
  message: string | ReactNode
}> = ({ type, title, message }) => {
  const iconStyles: Record<ToastType, { icon: ReactNode; color: string }> = {
    success: {
      icon: <Check className="w-5 h-5" />,
      color: 'text-cyan-400',
    },
    error: {
      icon: <X className="w-5 h-5" />,
      color: 'text-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-yellow-400',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      color: 'text-blue-400',
    },
  }

  const { icon, color } = iconStyles[type]

  return (
    <div className="flex gap-3 items-start">
      <div className={`flex-shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1">
        {title && <p className="font-bold text-white mb-1">{title}</p>}
        <p className="text-sm text-slate-200">{message}</p>
      </div>
    </div>
  )
}

export const showToast = ({
  message,
  type = 'success',
  duration = 3000,
  title,
}: ToastParams) => {
  const baseOptions: ToastOptions = {
    position: 'bottom-right',
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
    className: 'bg-slate-900 border border-slate-800 rounded-lg shadow-2xl',
    progressClassName: 'bg-gradient-to-r from-indigo-500 to-cyan-500',
  }

  const typeToastOptions: Record<ToastType, ToastOptions> = {
    success: {
      ...baseOptions,
      style: {
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
      },
    },
    error: {
      ...baseOptions,
      style: {
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
      },
    },
    warning: {
      ...baseOptions,
      style: {
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
      },
    },
    info: {
      ...baseOptions,
      style: {
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
      },
    },
  }

  const options = typeToastOptions[type]

  toast(
    <ToastContent type={type} title={title} message={message} />,
    options
  )
}

// Shorthand functions
export const successToast = (message: string, title?: string) =>
  showToast({ message, type: 'success', title })

export const errorToast = (message: string, title?: string) =>
  showToast({ message, type: 'error', title })

export const warningToast = (message: string, title?: string) =>
  showToast({ message, type: 'warning', title })

export const infoToast = (message: string, title?: string) =>
  showToast({ message, type: 'info', title })
