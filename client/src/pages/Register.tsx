import { FC, useState, useMemo, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Phone, Lock, Chrome, Facebook, Check, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Button from '../components/atomic/Button'
import Checkbox from '../components/atomic/Checkbox'
import { successToast, warningToast } from '../utils/toast'
import { registerValidationSchema, RegisterFormData } from '../validations/authValidation'

// Debounce helper
const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const Register: FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Email/Phone duplicate check
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [phoneExists, setPhoneExists] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerValidationSchema),
  })

  // Watch email and phone inputs
  const email = watch('email')
  const phone = watch('phone')
  const debouncedEmail = useDebounce(email, 500)
  const debouncedPhone = useDebounce(phone, 500)

  // Check email exists
  useEffect(() => {
    if (!debouncedEmail || !debouncedEmail.includes('@')) {
      setEmailExists(null)
      return
    }

    const controller = new AbortController()

    const checkEmail = async () => {
      setCheckingEmail(true)
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: debouncedEmail }),
        })
        const data = await res.json()
        setEmailExists(data.exists)
      } catch (error) {
        console.error('Error checking email:', error)
      } finally {
        setCheckingEmail(false)
      }
    }
    checkEmail()
    return () => controller.abort()
  }, [debouncedEmail])

  // Check phone exists
  useEffect(() => {
    if (!debouncedPhone || debouncedPhone.length < 9) {
      setPhoneExists(null)
      return
    }
    const controller = new AbortController()
    const checkPhone = async () => {
      setCheckingPhone(true)
      try {
        const res = await fetch('/api/auth/check-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: debouncedPhone }),
        })
        const data = await res.json()
        setPhoneExists(data.exists)
      } catch (error) {
        console.error('Error checking phone:', error)
      } finally {
        setCheckingPhone(false)
      }
    }
    checkPhone()
    return () => controller.abort()
  }, [debouncedPhone])

  // Password strength calculator with detailed hints
  const password = watch('password')
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '', hints: [] }

    const hints = [
      { label: 'Ít nhất 6 ký tự', met: password.length >= 6 },
      { label: 'Có chữ viết hoa (A-Z)', met: /[A-Z]/.test(password) },
      { label: 'Có chữ số (0-9)', met: /[0-9]/.test(password) },
      { label: 'Có ký tự đặc biệt (!@#$%...)', met: /[^A-Za-z0-9]/.test(password) },
    ]

    let strength = hints.filter(h => h.met).length
    if (strength <= 2) return { level: 1, label: 'Yếu', color: 'text-red-400 bg-red-500/20', hints }
    if (strength <= 3) return { level: 2, label: 'Trung Bình', color: 'text-yellow-400 bg-yellow-500/20', hints }
    return { level: 3, label: 'Mạnh', color: 'text-emerald-400 bg-emerald-500/20', hints }
  }, [password])

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) {
      warningToast('Bạn phải chấp nhận điều khoản và chính sách')
      return
    }

    // Check if email/phone already exists
    if (emailExists) {
      warningToast('Email này đã được đăng ký')
      return
    }
    if (phoneExists) {
      warningToast('Số điện thoại này đã được đăng ký')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        localStorage.setItem('accessToken', result.data.accessToken)
        if (result.data.user) {
          localStorage.setItem('user', JSON.stringify(result.data.user))
        }
        successToast('Đăng ký thành công!')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        const error = await response.json()
        warningToast(error.message || 'Đăng ký thất bại')
      }
    } catch (error) {
      warningToast('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center py-12"
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
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-white mb-2">VOLTRIX</h1>
          <p className="text-slate-400">Tạo tài khoản của bạn ngay hôm nay</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Tạo Tài Khoản</h2>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Họ và Tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register('name')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  style={{
                    WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                    WebkitAutofillTextFillColor: '#ffffff',
                    colorScheme: 'dark',
                  } as any}
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-3 w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                {!checkingEmail && emailExists === false && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-emerald-400" />
                )}
                {!checkingEmail && emailExists === true && (
                  <X className="absolute right-3 top-3 w-5 h-5 text-red-400" />
                )}
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
              {emailExists && (
                <p className="text-red-400 text-xs mt-1">Email này đã được đăng ký</p>
              )}
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Số Điện Thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  placeholder="0987654321"
                  {...register('phone')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {checkingPhone && (
                  <div className="absolute right-3 top-3 w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                {!checkingPhone && phoneExists === false && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-emerald-400" />
                )}
                {!checkingPhone && phoneExists === true && (
                  <X className="absolute right-3 top-3 w-5 h-5 text-red-400" />
                )}
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
              )}
              {phoneExists && (
                <p className="text-red-400 text-xs mt-1">Số điện thoại này đã được đăng ký</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  {...register('password')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  style={{
                    WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                    WebkitAutofillTextFillColor: '#ffffff',
                    colorScheme: 'dark',
                  } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
              {/* Password Strength Indicator with Hints */}
              {password && (
                <div className="mt-2 p-3 bg-slate-800/50 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-slate-400">Độ mạnh:</div>
                    <div className={`text-xs font-semibold ${passwordStrength.color} px-2 py-1 rounded`}>
                      {passwordStrength.label}
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all ${passwordStrength.level === 1
                          ? 'w-1/3 bg-red-500'
                          : passwordStrength.level === 2
                            ? 'w-2/3 bg-yellow-500'
                            : 'w-full bg-emerald-500'
                        }`}
                    />
                  </div>
                  <div className="space-y-1">
                    {passwordStrength.hints.map((hint, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {hint.met ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={hint.met ? 'text-slate-400' : 'text-slate-500'}>
                          {hint.label}
                        </span>
                      </div>
                    ))}
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
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Xác nhận mật khẩu"
                  {...register('confirmPassword')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  style={{
                    WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                    WebkitAutofillTextFillColor: '#ffffff',
                    colorScheme: 'dark',
                  } as any}
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
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onChange={setAcceptTerms}
              label={
                <>
                  Tôi đồng ý với{' '}
                  <a href="/terms" className="text-indigo-400 hover:text-indigo-300">
                    Điều khoản sử dụng
                  </a>{' '}
                  và{' '}
                  <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                    Chính sách bảo mật
                  </a>
                </>
              }
              className="mt-4"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading || checkingEmail ||
                checkingPhone ||
                emailExists === true ||
                phoneExists === true}
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/80 text-slate-400">Hoặc đăng ký với</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            >
              <Chrome className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Google</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            >
              <Facebook className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Facebook</span>
            </Button>
          </div>

          {/* Login Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Đăng nhập
            </button>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-500 text-xs mt-8">
          ✓ Tài khoản an toàn 100% - Chúng tôi không bao giờ chia sẻ thông tin của bạn
        </p>
      </div>
    </div>
  )
}

export default Register
