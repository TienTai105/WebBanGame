import { FC, useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Phone, Mail, ArrowRight, Loader } from 'lucide-react'
import { useCart } from '../context/CartContext'
import Button from '../components/atomic/Button'
import Stepper from '../components/modules/Stepper'
import OrderInfoCard from '../components/modules/OrderInfoCard'
import NextStepItem from '../components/modules/NextStepItem'
import InfoContactCard from '../components/modules/InfoContactCard'
import { successToast } from '../utils/toast'
import api from '../services/api'

type PaymentMethod = 'cash' | 'momo'

interface OrderData {
  paymentMethod: PaymentMethod
  formData: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    ward: string
    district?: string
  }
  appliedCodes: { code: string; amount: number; type: 'discount' | 'shipping' }[]
  orderCode?: string
  orderId?: string
  reservedUntil?: string
  orderItems?: {
    id: string
    name: string
    image: string
    price: number
    quantity: number
    variant?: string
    warranty?: string
  }[]
}

const OrderConfirmPage: FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)

  const orderId = searchParams.get('orderId')
  const toastShownRef = useRef(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    // Fetch order from API using orderId from URL params or localStorage
    const fetchOrder = async () => {
      // Prevent running twice in strict mode or on re-renders
      if (mountedRef.current) return
      mountedRef.current = true

      try {
        setLoading(true)
        const id = orderId || localStorage.getItem('lastOrderId')
        
        console.log('📥 FETCH ORDER - ID:', id)
        
        if (!id) {
          console.log('❌ NO ORDER ID - Redirecting to checkout')
          navigate('/checkout')
          return
        }

        console.log('🔄 FETCHING ORDER FROM API...')
        const res = await api.get(`/orders/${id}`)
        console.log('✅ API RESPONSE:', res.data)
        
        const order = res.data.data
        console.log('📦 ORDER DATA:', order)
        
        if (!order) {
          console.log('❌ NO ORDER DATA IN RESPONSE')
          navigate('/checkout')
          return
        }
        
        // Transform order data to match OrderData interface
        const orderData: OrderData = {
          paymentMethod: order.paymentMethod === 'Momo' ? 'momo' : 'cash',
          formData: {
            fullName: order.shippingAddress.name,
            email: order.shippingAddress.email || '',
            phone: order.shippingAddress.phone,
            address: order.shippingAddress.address,
            city: order.shippingAddress.city,
            ward: order.shippingAddress.ward || '',
            district: order.shippingAddress.district || '',
          },
          appliedCodes: [], // Not tracked in current order model
          orderCode: order.orderCode,
          orderId: order._id,
          reservedUntil: order.reservationExpiresAt,
          orderItems: order.orderItems.map((item: any) => ({
            id: item.product?.toString() || '',
            name: item.name,
            image: item.image || '',
            price: item.priceAtPurchase || item.price,
            quantity: item.quantity,
            variant: item.variant?.size || item.variant?.color || '',
          })),
        }
        
        console.log('🎯 TRANSFORMED ORDER:', orderData)
        setOrderData(orderData)
        // Clear cart after loading order (safe to call directly without dependency issues)
        clearCart()
        
        // Save orderId to localStorage for future reference
        localStorage.setItem('lastOrderId', order._id)
        // Clear checkout data since we now have order from DB
        localStorage.removeItem('checkoutData')
        console.log('✨ ORDER LOADED SUCCESSFULLY')
      } catch (err: any) {
        console.error('❌ FETCH ORDER ERROR:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          stack: err.stack
        })
        navigate('/checkout')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, []) // Empty dependency - fetch ONCE on mount only

  // Auto-show success toast for Momo payment on load
  useEffect(() => {
    if (orderData?.paymentMethod === 'momo' && !toastShownRef.current) {
      toastShownRef.current = true
      successToast('Thanh toán Momo thành công!')
      console.log('✨ AUTO SUCCESS TOAST SHOWN FOR MOMO')
    }
  }, [orderData?.paymentMethod])

  // Calculate estimated delivery
  const getEstimatedDelivery = (method: PaymentMethod) => {
    const today = new Date()
    let days = 4
    if (method === 'momo') days = 3
    if (method === 'cash') days = 4

    const delivery = new Date(today)
    delivery.setDate(delivery.getDate() + days)
    return delivery.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Không có dữ liệu đơn hàng</p>
          <Button onClick={() => navigate('/checkout')} variant="primary">
            Quay lại thanh toán
          </Button>
        </div>
      </div>
    )
  }

  const orderNumber = orderData?.orderCode || `ORDER-${Date.now().toString().slice(-8)}`
  const displayItems = orderData?.orderItems || []
  const estimatedDelivery = getEstimatedDelivery(orderData?.paymentMethod || 'momo')
  const paymentMethod = orderData?.paymentMethod || 'momo'
  const formData = orderData?.formData || {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    ward: '',
    district: '',
  }
  const appliedCodes = orderData?.appliedCodes || []

  // Calculate totals from order data
  const totalPrice = displayItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const shippingFee = 30000
  const productDiscountAmount = appliedCodes
    .filter(item => item.type === 'discount')
    .reduce((sum, item) => sum + item.amount, 0)
  const shippingDiscountAmount = appliedCodes
    .filter(item => item.type === 'shipping')
    .reduce((sum, item) => sum + item.amount, 0)
  const finalShippingFee = Math.max(0, shippingFee - shippingDiscountAmount)
  const finalTotal = totalPrice - productDiscountAmount + finalShippingFee

  // Status info based on payment method
  const statusInfo: Record<PaymentMethod, { status: string }> = {
    cash: { status: 'Chờ xác nhận' },
    momo: { status: 'Thanh toán thành công' },
  }

  const currentStatus = statusInfo[paymentMethod]

  return (
    <div
      className="min-h-screen bg-slate-950 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, 
            rgba(15, 23, 42, 1) 0%,
            rgba(30, 27, 75, 0.5) 25%,
            rgba(15, 23, 42, 1) 50%,
            rgba(30, 27, 75, 0.5) 75%,
            rgba(15, 23, 42, 1) 100%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Grid Pattern */}
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
      <div className="relative z-10">
        {/* STEPPER */}
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
          <Stepper
            steps={[
              { label: 'Giỏ hàng', description: 'Kiểm tra sản phẩm' },
              { label: 'Thanh toán', description: 'Nhập thông tin' },
              { label: 'Hoàn thành', description: 'Xác nhận đơn hàng' },
            ]}
            currentStep={2}
            onStepClick={() => {}}
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className={`rounded-full p-4 ${
                  paymentMethod === 'cash'
                    ? 'bg-yellow-500/10'
                    : 'bg-emerald-500/10'
                }`}
              >
                <CheckCircle
                  className={`w-12 h-12 ${
                    paymentMethod === 'cash'
                      ? 'text-yellow-400'
                      : 'text-emerald-400'
                  }`}
                />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Đơn hàng của bạn đã được tiếp nhận!</h1>
            <p className="text-slate-400 text-lg">Cảm ơn bạn đã mua sắm tại WebBanGame</p>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <OrderInfoCard
              label="Mã đơn hàng"
              value={<span className="font-mono text-2xl">{orderNumber}</span>}
              variant="info"
            />

            <OrderInfoCard
              label="Trạng thái đơn hàng"
              value={currentStatus.status}
              variant={
                paymentMethod === 'cash'
                  ? 'warning'
                  : 'success'
              }
            />

            <OrderInfoCard
              label="Ngày đặt hàng"
              value={new Date().toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              variant="default"
            />

            <OrderInfoCard
              label="Dự kiến giao hàng"
              value={estimatedDelivery}
              variant="default"
            />
          </div>

          {/* Payment Method Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Thông tin thanh toán</h3>

            {paymentMethod === 'momo' && (
              <div className="bg-slate-800/50 rounded p-4 border-l-4 border-indigo-500">
                <p className="text-white font-semibold mb-2">✓ Thanh toán bằng Momo - Thành công</p>
                <p className="text-slate-300 text-sm">
                  Giao dịch đã được xác nhận. Đơn hàng của bạn sẽ được chuẩn bị và gửi đi trong vòng 24 giờ tiếp theo.
                </p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="bg-slate-800/50 rounded p-4 border-l-4 border-yellow-500">
                <p className="text-white font-semibold mb-2">⏳ Thanh toán khi nhận hàng (COD)</p>
                <div className="space-y-2 text-slate-300 text-sm">
                  <p>Nhân viên của chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng 1-2 giờ.</p>
                  <p>Vui lòng chuẩn bị tiền mặt sẵn sàng khi nhân viên giao hàng đến.</p>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Thông tin giao hàng</h3>
            <div className="bg-slate-800/50 rounded p-4">
              <p className="text-white font-semibold mb-1">{formData.fullName}</p>
              <p className="text-slate-300 text-sm">
                {formData.address}
                {formData.district && <span>, {formData.district}</span>}
                {formData.city && <span>, {formData.city}</span>}
              </p>
              {formData.phone && (
                <p className="text-slate-300 text-sm mt-3">{formData.phone}</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Chi tiết đơn hàng</h3>

            {/* Items */}
            <div className="space-y-3 mb-6 pb-6 border-b border-slate-800">
              {displayItems.map((item: any) => (
                <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-white font-semibold">{item.name}</p>
                  {item.variant && <p className="text-indigo-400 text-sm">{item.variant}</p>}
                  {item.warranty && <p className="text-slate-400 text-xs">Bảo hành: {item.warranty}</p>}
                  <p className="text-slate-400 text-sm">Số lượng: {item.quantity}</p>
                </div>
                <p className="text-cyan-400 font-bold">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                </p>
              </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Tạm tính:</span>
                <span className="text-white font-bold">
                  {totalPrice.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {productDiscountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-lime-400">Giảm giá:</span>
                  <span className="text-lime-400 font-semibold">
                    -{productDiscountAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-400">Vận chuyển:</span>
                <span className="text-cyan-400 font-semibold">
                  {shippingDiscountAmount > 0 ? 'Miễn phí' : finalShippingFee.toLocaleString('vi-VN') + ' ₫'}
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-700">
                <span className="text-white font-bold">Tổng cộng:</span>
                <span className="text-2xl font-black text-cyan-400">
                  {finalTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Customer Support Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">🤝 Hỗ trợ khách hàng</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoContactCard
                title="Hotline"
                content="1800-WEBGAME (1800-9324263)"
                subtext="Thứ 2 - Chủ nhật: 8:00 - 22:00"
                icon={<Phone className="w-6 h-6" />}
                iconBgColor="bg-indigo-500/20"
                iconColor="text-indigo-400"
              />

              <InfoContactCard
                title="Email"
                content="support@webgame.com"
                subtext="Phản hồi trong vòng 2-4 giờ"
                icon={<Mail className="w-6 h-6" />}
                iconBgColor="bg-cyan-500/20"
                iconColor="text-cyan-400"
              />
            </div>

            <div className="bg-slate-700/30 border border-slate-700 rounded p-4 mt-4">
              <p className="text-slate-300 text-sm">
                📧 Một email xác nhận đơn hàng đã được gửi tới <span className="text-cyan-400 font-semibold">{formData.email}</span>. 
                Vui lòng kiểm tra hộp thư của bạn.
              </p>
            </div>
          </div>

          {/* Next Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">📋 Bước tiếp theo</h3>

            <div className="space-y-3 mb-6">
              <NextStepItem
                step={1}
                title="Kiểm tra email xác nhận"
                description="Nhân viên sẽ liên hệ bạn trong vòng 1-2 giờ"
              />

              <NextStepItem
                step={2}
                title="Theo dõi đơn hàng"
                description="Kiểm tra trạng thái đơn hàng tại tài khoản của bạn"
              />

              <NextStepItem
                step={3}
                title="Nhận sản phẩm"
                description={
                  paymentMethod === 'cash'
                    ? 'Chuẩn bị tiền mặt và nhận hàng'
                    : 'Nhân viên sẽ giao hàng đến địa chỉ của bạn'
                }
              />
            </div>

            <div className="border-t border-slate-800 pt-6">
              <p className="text-slate-400 text-sm mb-4">
                Bạn có thể theo dõi đơn hàng hoặc liên hệ hỗ trợ bất kỳ lúc nào.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/account/orders')}
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              Xem đơn hàng của tôi
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => {
                localStorage.removeItem('lastOrderId')
                navigate('/')
              }}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmPage
