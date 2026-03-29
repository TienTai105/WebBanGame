import React, { useState, useRef, useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

interface OTPVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (otpToken: string) => void
  actionDescription: string
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  actionDescription,
}) => {
  const { generateOTP, verifyOTP, user } = useAdminAuth()
  const [step, setStep] = useState<'confirm' | 'input'>('confirm')
  const [otpId, setOtpId] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [useDefaultOTP, setUseDefaultOTP] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Admin skips OTP entirely
  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      onVerified('')
    }
  }, [isOpen, user?.role])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm')
      setOtpId('')
      setCode(['', '', '', '', '', ''])
      setError('')
      setIsLoading(false)
      setUseDefaultOTP(false)
    }
  }, [isOpen])

  if (!isOpen || user?.role === 'admin') return null

  const handleSendOTP = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await generateOTP(actionDescription)
      setOtpId(result.otpId)
      setUseDefaultOTP(result.useDefaultOTP || false)
      setStep('input')
      setCountdown(300) // 5 min
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || 'Không thể gửi OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newCode = [...code]
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d
      })
      setCode(newCode)
      const nextIndex = Math.min(index + digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    if (!/^\d?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 số')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const result = await verifyOTP(otpId, fullCode)
      onVerified(result.otpToken)
    } catch (err: any) {
      setError(err.message || 'Mã OTP không hợp lệ')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 mx-auto bg-amber-100 rounded-full mb-4">
            <span
              className="material-symbols-outlined text-amber-600 text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
          </div>

          <h3 className="text-lg font-bold text-center text-slate-900 mb-2">
            Xác minh OTP
          </h3>

          {step === 'confirm' && (
            <>
              <p className="text-center text-slate-600 text-sm mb-6">
                Thao tác <span className="font-semibold text-slate-800">"{actionDescription}"</span> yêu
                cầu xác minh OTP. Mã OTP sẽ được gửi đến email của bạn.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
              </div>
            </>
          )}

          {step === 'input' && (
            <>
              <p className="text-center text-slate-600 text-sm mb-1">
                {useDefaultOTP
                  ? 'Nhập mã OTP mặc định đã được thiết lập'
                  : 'Nhập mã 6 số đã gửi đến email của bạn'}
              </p>
              {countdown > 0 && (
                <p className="text-center text-slate-400 text-xs mb-5">
                  Hết hạn sau {formatCountdown(countdown)}
                </p>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-4">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isLoading || code.join('').length !== 6}
                  className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang xác minh...' : 'Xác minh'}
                </button>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={isLoading || countdown > 240}
                className="w-full mt-3 text-sm text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 transition-colors"
              >
                Gửi lại mã OTP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default OTPVerificationModal
