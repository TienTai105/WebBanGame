import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Loader } from 'lucide-react'
import Button from './atomic/Button'
import { successToast, errorToast } from '../utils/toast'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

const ForgotPasswordModal: FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    // Validation
    if (!email.trim()) {
      setEmailError('Email là bắt buộc')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Vui lòng nhập email hợp lệ')
      return
    }

    setIsLoading(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        successToast('Nếu email tồn tại, bạn sẽ nhận được mã OTP!')
        // Close modal and navigate to reset password page with email
        onClose()
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)
        }, 500)
      } else {
        errorToast(data.message || 'Lỗi khi gửi OTP')
      }
    } catch (error) {
      console.error('Error:', error)
      errorToast('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          className="bg-slate-900/95 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Quên Mật Khẩu?</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <p className="text-slate-400 text-sm mb-6">
            Nhập email của bạn và chúng tôi sẽ gửi một mã OTP để xác nhận danh tính
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError('')
                  }}
                  disabled={isLoading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {emailError && (
                <p className="text-red-400 text-xs mt-1">{emailError}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi Mã OTP'
              )}
            </Button>

            {/* Close Button */}
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="lg"
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              disabled={isLoading}
            >
              Hủy
            </Button>
          </form>

          {/* Security Note */}
          <p className="text-slate-500 text-xs mt-6 text-center">
            🔒 Thông tin của bạn được bảo vệ an toàn. Chúng tôi sẽ không bao giờ chia sẻ email của bạn.
          </p>
        </div>
      </div>
    </>
  )
}

export default ForgotPasswordModal
