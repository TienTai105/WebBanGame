import * as yup from 'yup'

// Helper function to sanitize input
const sanitizeInput = (value: string) => {
  if (!value) return value
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .trim()
}

// Login validation schema
export const loginValidationSchema = yup.object({
  email: yup
    .string()
    .transform(sanitizeInput)
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),
  password: yup
    .string()
    .transform(sanitizeInput)
    .min(6, 'Mật khẩu phải tối thiểu 6 ký tự')
    .required('Mật khẩu là bắt buộc'),
})

export type LoginFormData = yup.InferType<typeof loginValidationSchema>

// Register validation schema
export const registerValidationSchema = yup.object({
  name: yup
    .string()
    .transform(sanitizeInput)
    .min(2, 'Họ tên phải tối thiểu 2 ký tự')
    .max(50, 'Họ tên không được quá 50 ký tự')
    .required('Họ tên là bắt buộc'),
  email: yup
    .string()
    .transform(sanitizeInput)
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),
  phone: yup
    .string()
    .transform(sanitizeInput)
    .matches(/^0\d{9}$/, 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số')
    .required('Số điện thoại là bắt buộc'),
  password: yup
    .string()
    .transform(sanitizeInput)
    .min(6, 'Mật khẩu phải tối thiểu 6 ký tự')
    .matches(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa')
    .matches(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
    .required('Mật khẩu là bắt buộc'),
  confirmPassword: yup
    .string()
    .transform(sanitizeInput)
    .oneOf([yup.ref('password')], 'Xác nhận mật khẩu không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),
})

export type RegisterFormData = yup.InferType<typeof registerValidationSchema>
