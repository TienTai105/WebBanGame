import { FC, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const MomoReturnPage: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const orderId = params.get('orderId')
    const resultCode = params.get('resultCode')
    const transId = params.get('transId')

    const message = {
      type: 'MOMO_RETURN',
      orderId,
      resultCode,
      transId,
    }

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(message, window.location.origin)
        window.close()
        return
      } catch (error) {
        console.warn('Unable to postMessage to opener:', error)
      }
    }

    // Fallback if opened directly or opener is unavailable
    if (orderId) {
      const query = resultCode && transId ? `&resultCode=${resultCode}&transId=${transId}` : ''
      navigate(`/checkout?orderId=${orderId}&momoReturn=true${query}`)
    } else {
      navigate('/checkout')
    }
  }, [location.search, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="max-w-md w-full rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-lg">
        <h1 className="text-2xl font-semibold mb-4">Đang xử lý thanh toán Momo...</h1>
        <p className="text-sm text-slate-300">
          Nếu trang không tự động đóng, bạn có thể quay lại tab trước. Đơn hàng sẽ được cập nhật ngay khi Momo hoàn tất.
        </p>
      </div>
    </div>
  )
}

export default MomoReturnPage
