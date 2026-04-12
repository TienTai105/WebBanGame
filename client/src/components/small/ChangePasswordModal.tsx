import { FC, useState, useMemo } from 'react'
import { Eye, EyeOff, Lock, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Button from '../atomic/Button'
import { successToast, warningToast } from '../../utils/toast'
import { useChangePassword } from '../../hooks/mutations/useChangePassword'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

// Validation schema
const changePasswordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Mật khẩu hiện tại là bắt buộc')
    .min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: yup
    .string()
    .required('Mật khẩu mới là bắt buộc')
    .min(8, 'Mật khẩu phải ít nhất 8 ký tự')
    .matches(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
    .matches(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 số')
    .matches(/[@$!%*?&]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp'),
})

interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Password strength checker
const checkPasswordStrength = (password: string) => {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password),
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length
  const strength = (passedChecks / 4) * 100
  
  return { strength, checks }
}

const ChangePasswordModal: FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPasswordValue, setNewPasswordValue] = useState('')

  const { mutate, isPending, error } = useChangePassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: yupResolver(changePasswordSchema),
  })

  const { strength, checks } = useMemo(() => checkPasswordStrength(newPasswordValue), [newPasswordValue])

  const onSubmit = async (data: ChangePasswordFormData) => {
    mutate(data, {
      onSuccess: () => {
        successToast('Mật khẩu đã thay đổi thành công!')
        reset()
        setNewPasswordValue('')
        onClose()
      },
      onError: (err: any) => {
        const errorMessage = err.response?.data?.message || 'Lỗi khi thay đổi mật khẩu'
        warningToast(errorMessage)
      },
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Đổi Mật Khẩu</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Mật Khẩu Hiện Tại
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu hiện tại"
                {...register('currentPassword')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Mật Khẩu Mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                {...register('newPassword')}
                onChange={(e) => {
                  register('newPassword').onChange(e)
                  setNewPasswordValue(e.target.value)
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>
            )}

            {/* Password Strength Indicator */}
            {newPasswordValue && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        strength <= 25 ? 'bg-red-500 w-1/4' :
                        strength <= 50 ? 'bg-yellow-500 w-1/2' :
                        strength <= 75 ? 'bg-blue-500 w-3/4' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${
                    strength <= 25 ? 'text-red-400' :
                    strength <= 50 ? 'text-yellow-400' :
                    strength <= 75 ? 'text-blue-400' :
                    'text-green-400'
                  }`}>
                    {strength <= 25 ? 'Yếu' : strength <= 50 ? 'Trung bình' : strength <= 75 ? 'Tốt' : 'Rất tốt'}
                  </span>
                </div>

                {/* Requirements Checklist */}
                <div className="bg-slate-800/50 rounded p-2 space-y-1">
                  <div className={`flex items-center gap-2 text-xs ${checks.minLength ? 'text-green-400' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded border ${checks.minLength ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                      {checks.minLength && <span className="text-white text-xs flex items-center justify-center">✓</span>}
                    </div>
                    Ít nhất 8 ký tự
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${checks.uppercase ? 'text-green-400' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded border ${checks.uppercase ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                      {checks.uppercase && <span className="text-white text-xs flex items-center justify-center">✓</span>}
                    </div>
                    1 chữ hoa (A-Z)
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${checks.number ? 'text-green-400' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded border ${checks.number ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                      {checks.number && <span className="text-white text-xs flex items-center justify-center">✓</span>}
                    </div>
                    1 số (0-9)
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${checks.special ? 'text-green-400' : 'text-slate-500'}`}>
                    <div className={`w-4 h-4 rounded border ${checks.special ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                      {checks.special && <span className="text-white text-xs flex items-center justify-center">✓</span>}
                    </div>
                    1 ký tự đặc biệt (@$!%*?&)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Xác Nhận Mật Khẩu Mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                {...register('confirmPassword')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Error from API */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-red-400 text-sm">
                {(error as any).response?.data?.message || 'Lỗi khi thay đổi mật khẩu'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Đang xử lý...' : 'Thay Đổi Mật Khẩu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
