import { FC, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader, ArrowLeft, Check, X } from 'lucide-react'
import Button from '../components/atomic/Button'
import OTPInput from '../components/OTPInput'
import { successToast, errorToast, warningToast } from '../utils/toast'

type ResetStep = 'otp' | 'password'

interface PasswordStrength {
  score: number // 0-3: weak, medium, strong
  label: string
  color: string
}
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ResetPasswordPage: FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  // Step management
  const [step, setStep] = useState<ResetStep>('otp')

  // OTP Step
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendAttempts, setResendAttempts] = useState(0)

  // Password Step
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      warningToast('Vui lòng yêu cầu mã OTP mới')
      navigate('/login')
    }
  }, [email, navigate])

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Calculate password strength
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0

    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const strengths: PasswordStrength[] = [
      { score: 0, label: 'Yếu', color: '#ef4444' },
      { score: 1, label: 'Yếu', color: '#ef4444' },
      { score: 2, label: 'Trung bình', color: '#f59e0b' },
      { score: 3, label: 'Mạnh', color: '#10b981' },
      { score: 4, label: 'Rất mạnh', color: '#10b981' },
    ]

    return strengths[Math.min(score, 4)]
  }

  const handleVerifyOTP = async () => {
    setOtpError('')

    if (!otp || otp.length !== 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 chữ số OTP')
      return
    }

    setOtpLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email?.trim(),
          otp: otp,
        }),
      })

      const data = await response.json()

      if (response.ok && data.data?.resetToken) {
        setResetToken(data.data.resetToken)
        setStep('password')
        successToast('OTP hợp lệ! Vui lòng nhập mật khẩu mới')
      } else {
        setOtpError(
          data.message || 'OTP không hợp lệ hoặc đã hết hạn'
        )
      }
    } catch (error) {
      console.error('Error:', error)
      setOtpError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCountdown > 0) {
      warningToast(`Vui lòng đợi ${resendCountdown} giây trước khi yêu cầu OTP mới`)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email?.trim() }),
      })

      if (response.ok) {
        setResendCountdown(60)
        setOtp('')
        setOtpError('')
        setResendAttempts(resendAttempts + 1)
        successToast('Mã OTP mới đã được gửi!')
      } else {
        const data = await response.json()
        errorToast(data.message || 'Không thể gửi OTP mới')
      }
    } catch (error) {
      console.error('Error:', error)
      errorToast('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const validatePasswords = (): boolean => {
    setPasswordError('')

    if (!newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ mật khẩu')
      return false
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu không khớp')
      return false
    }

    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu phải có ít nhất 8 ký tự')
      return false
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Mật khẩu phải chứa ít nhất một ký tự in hoa')
      return false
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Mật khẩu phải chứa ít nhất một chữ số')
      return false
    }

    return true
  }

  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email?.trim(),
          newPassword,
          confirmPassword,
          resetToken,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        successToast('Mật khẩu đã được đặt lại thành công!')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        setPasswordError(data.message || 'Lỗi khi đặt lại mật khẩu')
      }
    } catch (error) {
      console.error('Error:', error)
      setPasswordError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setPasswordLoading(false)
    }
  }

  const passwordStrength = calculatePasswordStrength(newPassword)

  return (
    <div
      className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(34, 211, 238, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 50% 90%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, 
            rgba(15, 23, 42, 1) 0%,
            rgba(30, 27, 75, 0.4) 25%,
            rgba(15, 23, 42, 1) 50%,
            rgba(30, 27, 75, 0.4) 75%,
            rgba(15, 23, 42, 1) 100%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl px-4 sm:px-6">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">VOLTRIX</h1>
          <p className="text-slate-400">Đặt lại mật khẩu</p>
        </div>

        {/* Reset Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center text-slate-400 hover:text-slate-300 text-sm font-semibold transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Đăng Nhập
          </button>

          {/* STEP 1: OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Xác nhận OTP</h2>
                <p className="text-slate-400 text-sm">
                  Mã xác nhận đã được gửi đến <strong className="text-slate-300">{email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-4">
                  Nhập mã OTP 6 chữ số
                </label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={otpLoading}
                  onComplete={handleVerifyOTP}
                />
              </div>

              {/* Error Message */}
              {otpError && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{otpError}</p>
                </div>
              )}

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOTP}
                variant="primary"
                size="lg"
                className="w-full"
                disabled={otpLoading || otp.length !== 6}
              >
                {otpLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  'Xác nhận OTP'
                )}
              </Button>

              {/* Resend Section */}
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Không nhận được mã?</p>
                <button
                  onClick={handleResendOTP}
                  disabled={resendCountdown > 0 || otpLoading}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0
                    ? `Gửi lại trong ${resendCountdown}s`
                    : 'Gửi lại mã OTP'}
                </button>
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-xs">
                  💡 Mã OTP sẽ hết hạn sau 5 phút. Hãy nhập nhanh nhé!
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Password Reset */}
          {step === 'password' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Tạo Mật Khẩu Mới</h2>
                <p className="text-slate-400 text-sm">
                  Vui lòng nhập mật khẩu mới mạnh cho tài khoản của bạn
                </p>
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Mật Khẩu Mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setPasswordError('')
                    }}
                    disabled={passwordLoading}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Độ mạnh mật khẩu:</span>
                      <span style={{ color: passwordStrength.color }} className="text-xs font-semibold">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${(passwordStrength.score / 4) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>

                    {/* Password Requirements */}
                    <div className="space-y-1 mt-3">
                      <div className="flex items-center gap-2 text-xs">
                        {newPassword.length >= 8 ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={newPassword.length >= 8 ? 'text-slate-300' : 'text-slate-500'}>
                          Ít nhất 8 ký tự
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {/[A-Z]/.test(newPassword) ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={/[A-Z]/.test(newPassword) ? 'text-slate-300' : 'text-slate-500'}>
                          Ký tự in hoa (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {/[0-9]/.test(newPassword) ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={/[0-9]/.test(newPassword) ? 'text-slate-300' : 'text-slate-500'}>
                          Chữ số (0-9)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Xác Nhận Mật Khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setPasswordError('')
                    }}
                    disabled={passwordLoading}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {newPassword === confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Mật khẩu trùng khớp</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400">Mật khẩu không trùng khớp</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{passwordError}</p>
                </div>
              )}

              {/* Reset Button */}
              <Button
                onClick={handleResetPassword}
                variant="primary"
                size="lg"
                className="w-full"
                disabled={
                  passwordLoading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                {passwordLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Đang đặt lại...
                  </>
                ) : (
                  'Đặt Lại Mật Khẩu'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
