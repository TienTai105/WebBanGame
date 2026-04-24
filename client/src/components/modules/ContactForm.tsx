import React, { useState, useRef } from 'react'
import { Button, Icon } from '../atomic'
import { successToast, errorToast, warningToast } from '../../utils/toast'

const ContactForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const subjectDetailsRef = useRef<HTMLDetailsElement>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: 'support',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.message
    ) {
      warningToast('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsLoading(true)

    try {
      const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrfToken='))
  ?.split('=')[1]
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: { 
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
  },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Có lỗi xảy ra')
      }

      const result = await response.json()
      successToast(result.message || 'Tin nhắn đã được gửi thành công!')
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: 'support',
        message: '',
      })
    } catch (error: any) {
      errorToast(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 sticky top-28">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white font-space-grotesk mb-2">
          Gửi Tin Nhắn
        </h2>
        <p className="text-slate-400 text-sm">
          Chúng tôi sẽ phản hồi yêu cầu của bạn trong vòng 24 giờ làm việc.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Họ và Tên
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Số Điện Thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="090 123 4567"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Chủ Đề
          </label>
          <details ref={subjectDetailsRef} className="group relative">
            <summary className="flex items-center justify-between px-4 py-3 bg-slate-900/30 border border-indigo-500/30 rounded-lg text-white text-sm cursor-pointer hover:border-indigo-400/50 transition list-none">
              <span className="font-medium">
                {formData.subject === 'support' && 'Hỗ trợ kỹ thuật'}
                {formData.subject === 'sales' && 'Tư vấn mua hàng'}
                {formData.subject === 'partnership' && 'Hợp tác kinh doanh'}
                {formData.subject === 'feedback' && 'Phản ánh dịch vụ'}
              </span>
              <Icon name="expand_more" size="sm" className="group-open:rotate-180 transition text-indigo-400" />
            </summary>
            <div className="absolute top-full left-0 right-0 mb-2 bg-slate-900 border border-indigo-500/30 rounded-lg shadow-2xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  setFormData({ ...formData, subject: 'support' })
                  subjectDetailsRef.current?.removeAttribute('open')
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition border-l-2 ${
                  formData.subject === 'support' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                }`}
              >
                Hỗ trợ kỹ thuật
              </button>
              <button
                onClick={() => {
                  setFormData({ ...formData, subject: 'sales' })
                  subjectDetailsRef.current?.removeAttribute('open')
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition border-l-2 ${
                  formData.subject === 'sales' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                }`}
              >
                Tư vấn mua hàng
              </button>
              <button
                onClick={() => {
                  setFormData({ ...formData, subject: 'partnership' })
                  subjectDetailsRef.current?.removeAttribute('open')
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition border-l-2 ${
                  formData.subject === 'partnership' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                }`}
              >
                Hợp tác kinh doanh
              </button>
              <button
                onClick={() => {
                  setFormData({ ...formData, subject: 'feedback' })
                  subjectDetailsRef.current?.removeAttribute('open')
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition border-l-2 ${
                  formData.subject === 'feedback' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                }`}
              >
                Phản ánh dịch vụ
              </button>
            </div>
          </details>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Nội Dung Tin Nhắn
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Bạn cần hỗ trợ điều gì?"
            rows={4}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-y"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          loadingText="Đang gửi..."
          size="md"
          variant="primary"
          className="w-full mt-6"
          icon={!isLoading ? 'send' : undefined}
        >
          Gửi Ngay
        </Button>
      </form>

      {/* Support Info */}
      <div className="mt-8 pt-8 border-t border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-indigo-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.01 15.7l-1.73-1.73c-.77-.77-2.03-.77-2.8 0l-.79.79c-.77.77-2.03.77-2.8 0L9.1 10.5c-.77-.77-.77-2.03 0-2.8l.79-.79c.77-.77.77-2.03 0-2.8L9.3 2.99c-.78-.78-2.05-.78-2.84 0l-5.46 5.46c-.77.77-1.19 1.77-1.19 2.84 0 1.07.42 2.07 1.19 2.84l10.85 10.85c1.56 1.56 4.09 1.56 5.66 0l5.46-5.46c.78-.78.78-2.05 0-2.83z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hỗ trợ 24/7
            </p>
            <p className="text-white font-bold">Hotline: 1900 8888</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactForm
