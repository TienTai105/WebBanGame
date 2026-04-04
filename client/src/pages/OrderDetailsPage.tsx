import { FC, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/atomic'
import Button from '../components/atomic/Button'
import Stepper from '../components/modules/Stepper'
import ConfirmDialog from '../components/modules/ConfirmDialog'
import { cn } from '../utils/cn'
import api from '../services/api'
import { toast } from 'react-toastify'

interface OrderItem {
  _id?: string
  product?: {
    _id: string
    name: string
    slug: string
    images: string[]
    price: number
  }
  quantity: number
  name: string
  image?: string
  priceAtPurchase: number
  variant?: string
  warranty?: string
}

interface ShippingAddress {
  name: string
  address: string
  city: string
  district: string
  ward: string
  phone: string
}

interface OrderData {
  _id: string
  orderCode: string
  orderStatus: 'pending' | 'processing' | 'shipped' | 'completed' | 'failed' | 'cancelled'
  orderItems: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: 'COD' | 'MOMO' | 'cash' | 'momo'
  paymentStatus: 'paid' | 'unpaid' | 'failed'
  totalPrice: number
  discountCode?: string
  discountAmount: number
  shippingFee: number
  finalPrice: number
  createdAt: string
  updatedAt: string
}

const OrderDetailsPage: FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching order:', orderId)
        const response = await api.get(`/orders/${orderId}`)
        console.log('Order response:', response.data)
        
        const orderData = response.data.data
        if (!orderData) {
          throw new Error('No order data in response')
        }
        
        setOrder(orderData)
      } catch (err: any) {
        console.error('Failed to fetch order:', err)
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load order details'
        setError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId, navigate])

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true)
      const response = await api.put(`/orders/${orderId}/cancel`)
      
      if (response.data.success) {
        const updatedOrder = response.data.data
        setOrder(updatedOrder)
        setShowCancelDialog(false)
        
        // Show success toast
        toast.success('Đơn hàng đã được hủy thành công! Quay lại danh sách đơn hàng...', {
          autoClose: 3000,
        })
        
        // Auto redirect to profile after 3 seconds
        setTimeout(() => {
          navigate('/profile')
        }, 3000)
      } else {
        toast.error(response.data.message || 'Không thể hủy đơn hàng')
      }
    } catch (err: any) {
      console.error('Failed to cancel order:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Hủy đơn hàng thất bại'
      toast.error(errorMsg)
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancelOrder = order && (order.orderStatus === 'pending' || order.orderStatus === 'processing')

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-3">Loading order details...</div>
          <div className="text-slate-400 text-sm">Please wait...</div>
        </div>
      </main>
    )
  }

  if (!order || error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900/50 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <div className="text-white text-xl mb-2 font-bold">Unable to Load Order</div>
          <div className="text-red-400 text-sm mb-6">{error || 'Failed to load order details'}</div>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition"
          >
            Back to Profile
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
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
      <div className="relative z-10">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12">
          {/* Cancelled Order Banner */}
          {order.orderStatus === 'cancelled' && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <Icon name="cancel" size="md" className="text-red-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-400">Đơn hàng đã bị hủy</p>
                <p className="text-sm text-red-300">Đơn hàng này đã được hủy vào lúc {new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN - Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Success Header */}
              <section className={cn(
                "backdrop-blur-sm rounded-xl p-8 shadow-lg",
                order.orderStatus === 'cancelled'
                  ? "bg-gradient-to-br from-red-950/60 to-slate-900/60 border border-red-500/30 shadow-red-500/10"
                  : "bg-gradient-to-br from-indigo-950/60 to-slate-900/60 border border-indigo-500/30 shadow-indigo-500/10"
              )}>
                <div className="mb-8">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4",
                    order.orderStatus === 'cancelled'
                      ? "bg-red-500/20 border border-red-500/30 text-red-400"
                      : "bg-green-500/20 border border-green-500/30 text-green-400"
                  )}>
                    <Icon name={order.orderStatus === 'cancelled' ? "cancel" : "check_circle"} size="xs" />
                    {order.orderStatus === 'cancelled' ? 'ĐƠN HÀNG ĐÃ BỊ HỦY' : 'ĐẶT HÀNG THÀNH CÔNG'}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                    {order.orderStatus === 'cancelled' ? 'Đơn hàng đã bị hủy' : 'Cảm ơn bạn đã mua hàng'}
                  </h1>
                  <p className="text-slate-300 mt-2 font-medium">
                    Mã đơn hàng:{' '}
                    <span className={order.orderStatus === 'cancelled' ? 'text-red-400 font-bold' : 'text-indigo-400 font-bold'}>#{order.orderCode}</span>
                  </p>
                </div>

                {/* Status Stepper */}
                {order.orderStatus !== 'cancelled' && (
                  <div className="mb-8">
                    <Stepper
                      steps={[
                        { label: 'Đã đặt', description: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '' },
                        { label: 'Xác nhận', description: order.orderStatus !== 'pending' ? 'Đã xác nhận' : 'Chờ xác nhận' },
                        { label: 'Đang giao', description: order.orderStatus === 'shipped' || order.orderStatus === 'completed' ? 'Đang giao' : 'Chờ cập nhật' },
                        { label: 'Đã nhận', description: order.orderStatus === 'completed' ? 'Đã nhận' : 'Chờ cập nhật' },
                      ]}
                      currentStep={(() => {
                        const status = order.orderStatus?.toLowerCase() || ''
                        if (status === 'completed') return 3
                        if (status === 'shipped') return 2
                        if (status === 'processing') return 1
                        return 0
                      })()}
                    />
                  </div>
                )}
              </section>

              {/* Shipping & Payment Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <Icon name="location_on" size="sm" className="text-indigo-400" />
                    Địa chỉ giao hàng
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed space-y-1">
                    <p className="font-bold text-white">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>
                      {order.shippingAddress.ward}, {order.shippingAddress.district}
                    </p>
                    <p>{order.shippingAddress.city}</p>
                    <p className="pt-2 text-white font-medium">{order.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <Icon name="payments" size="sm" className="text-indigo-400" />
                    Thanh toán
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center flex-shrink-0">
                        <Icon name="credit_card" size="sm" className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-white capitalize">
                          {order.paymentMethod?.toUpperCase() === 'MOMO' ? 'Momo' : 'Thanh toán khi nhận hàng'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.paymentMethod?.toUpperCase() === 'MOMO'
                            ? 'Ví điện tử Momo'
                            : 'COD'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg border',
                        order.paymentStatus === 'paid'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : order.paymentStatus === 'unpaid'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      )}
                    >
                      <Icon
                        name={
                          order.paymentStatus === 'paid'
                            ? 'check_circle'
                            : 'schedule'
                        }
                        size="xs"
                      />
                      {order.paymentStatus === 'paid'
                        ? 'Đã thanh toán'
                        : order.paymentStatus === 'unpaid'
                        ? 'Chờ thanh toán'
                        : 'Thanh toán thất bại'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="bg-slate-900/30 border border-indigo-500/20 rounded-xl p-8">
                <h3 className="font-bold text-xl mb-6 text-white">Sản phẩm đã mua</h3>

                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div
                      key={item._id || index}
                      className="flex gap-6 p-4 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-24 h-24 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 flex items-center justify-center">
                        <img
                          src={item.image || item.product?.images?.[0] || 'https://via.placeholder.com/96?text=No+Image'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image'
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white mb-1">{item.name}</h4>
                          {item.variant && (
                            <p className="text-xs text-slate-400 mb-2">
                              Variant: {item.variant}
                            </p>
                          )}
                          {item.warranty && (
                            <p className="text-xs text-slate-400">
                              Bảo hành: {item.warranty}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-slate-300">
                              Số lượng: <span className="font-bold text-white">{item.quantity}</span>
                            </p>
                            {/* Review Button */}
                            {order.orderStatus === 'completed' && item.product?._id && (
                              <button
                                onClick={() => navigate(`/products/${item.product._id}?scroll=review`)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                              >
                                ⭐ Đánh giá
                              </button>
                            )}
                          </div>
                          <p className="font-bold text-indigo-400 text-base">
                            {item.priceAtPurchase.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-6 sticky top-20 space-y-6">
                <h3 className="font-bold text-xl pb-4 border-b border-slate-700 text-white">
                  Chi tiết hóa đơn
                </h3>

                {/* Voucher Giảm Giá */}
                {order.discountCode && order.discountAmount > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-2">Voucher giảm giá</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-400">{order.discountCode}</span>
                      <button className="text-red-400 hover:text-red-300 text-xs font-bold">Xóa</button>
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-green-400 font-semibold">-{order.discountAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                )}

                {/* Pricing Details */}
                <div className="space-y-3 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tạm tính</span>
                    <span className="font-semibold text-white">
                      {order.totalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex justify-between text-sm border-t border-slate-600/50 pt-2">
                    <span className="text-slate-400">Phí vận chuyển</span>
                    <span className="font-semibold text-white">
                      {order.shippingFee > 0 ? order.shippingFee.toLocaleString('vi-VN') + ' ₫' : 'Miễn phí'}
                    </span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm border-t border-slate-600/50 pt-2">
                      <span className="text-slate-400">Giảm giá</span>
                      <span className="text-green-400 font-semibold">
                        -{order.discountAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-3 border-t border-slate-600/50 flex justify-between items-end">
                    <span className="text-slate-300 font-semibold">Tổng thanh toán</span>
                    <span className="font-black text-xl text-indigo-400">
                      {order.finalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  {order.orderStatus === 'cancelled' ? (
                    <>
                      <div className="w-full p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                        <p className="text-red-400 text-sm font-bold">Đơn hàng đã bị hủy</p>
                        <p className="text-red-300 text-xs mt-1">Bạn không thể thực hiện thêm thao tác nào</p>
                      </div>
                      
                      <Button
                        onClick={() => navigate('/profile')}
                        variant="primary"
                        size="md"
                        className="w-full justify-center gap-2"
                      >
                        <Icon name="arrow_back" size="sm" />
                        Quay lại danh sách đơn hàng
                      </Button>
                    </>
                  ) : canCancelOrder ? (
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isCancelling}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 hover:border-red-500/60 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="delete_outline" size="sm" />
                      {isCancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                    </button>
                  ) : null}

                  {order.orderStatus !== 'cancelled' && (
                    <>
                      <Button
                        onClick={() => navigate('/games')}
                        variant="primary"
                        size="md"
                        className="w-full justify-center gap-2"
                      >
                        <Icon name="arrow_back" size="sm" />
                        Tiếp tục mua sắm
                      </Button>

                      <button
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors"
                      >
                        <Icon name="print" size="sm" />
                        In hóa đơn
                      </button>
                    </>
                  )}
                </div>

                {/* Support Info */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg flex items-start gap-3">
                  <Icon
                    name="help_outline"
                    size="md"
                    className="text-indigo-400 flex-shrink-0 mt-1"
                  />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Cần hỗ trợ? Liên hệ hotline{' '}
                    <span className="font-bold text-indigo-400">1900 1234</span> hoặc email{' '}
                    <span className="font-bold text-indigo-400">support@voltrix.vn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={handleCancelOrder}
        title="Hủy đơn hàng?"
        message={
          <>
            Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            {order?.paymentStatus === 'paid' && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-sm">
                ⚠️ Đơn hàng đã được thanh toán. Sau khi hủy, tiền sẽ được hoàn lại.
              </div>
            )}
          </>
        }
        confirmText="Hủy đơn hàng"
        cancelText="Không, giữ lại"
        variant="danger"
        isLoading={isCancelling}
      />
    </main>
  )
}

export default OrderDetailsPage
