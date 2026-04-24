import { FC, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Chrome, Facebook } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Button from '../components/atomic/Button'
import { successToast, warningToast } from '../utils/toast'
import { loginValidationSchema, LoginFormData } from '../validations/authValidation'
import { connectSocket } from '../utils/socket'

const Login: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginValidationSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Allow browser to set/send cookies
        body: JSON.stringify(data),
      })

      const responseText = await response.text()
      let result: any = null
      let errorMessage = 'Email hoặc mật khẩu không đúng'

      try {
        result = JSON.parse(responseText)
      } catch {
        if (responseText) {
          errorMessage = responseText
        }
      }

      if (response.ok && result) {
        const user = result.data.user
        const token = result.data.accessToken

        // Store token and user data
        localStorage.setItem('accessToken', token)
        localStorage.setItem('user', JSON.stringify(user))

        // Check user role - redirect accordingly
        // Connect socket for real-time tracking
        connectSocket(token)

        if (user.role === 'admin' || user.role === 'staff') {
          // Admin/Staff user - store admin auth and redirect to admin dashboard
          localStorage.setItem('adminToken', token)
          localStorage.setItem('adminUser', JSON.stringify(user))
          // Notify AdminAuthContext of changes
          window.dispatchEvent(new Event('adminAuthChanged'))
          window.dispatchEvent(new Event('adminLoggedIn'))
          successToast('Đăng nhập admin thành công!')
          navigate('/admin/dashboard')
        } else {
          // Regular customer - redirect to home
          window.dispatchEvent(new Event('userLoggedIn'))
          successToast('Đăng nhập thành công!')
          const redirectTo = (location.state as any)?.from || '/'
          setTimeout(() => navigate(redirectTo), 1500)
        }
      } else {
        warningToast((result && result.message) || errorMessage)
      }
    } catch (error) {
      warningToast('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

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
          <p className="text-slate-400">Chào mừng trở lại</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Đăng Nhập</h2>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  style={{
                    WebkitAutofillBoxShadow: '0 0 0 1000px rgb(30, 27, 75) inset',
                    WebkitAutofillTextFillColor: '#ffffff',
                    colorScheme: 'dark',
                  } as any}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
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
            </div>

            {/* Remember & Forgot */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/80 text-slate-400">Hoặc tiếp tục với</span>
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

          {/* Signup Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Đăng ký ngay
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

export default Login
