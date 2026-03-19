import { FC, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertTriangle } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { useCart } from '../context/CartContext'
import Button from '../components/atomic/Button'
import Stepper from '../components/modules/Stepper'
import ConfirmDialog from '../components/modules/ConfirmDialog'
import { successToast, warningToast } from '../utils/toast'
import api from '../services/api'

const CartPage: FC = () => {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem } = useCart()
  
  // Confirm dialog state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const itemToDeleteInfo = items.find(item => item.id === itemToDelete)

  // Stock validation - check each cart item in parallel
  const stockQueries = useQueries({
    queries: items.map(item => ({
      queryKey: ['inventory', item.productId, item.variantSku ?? 'null', item.quantity],
      queryFn: () =>
        api
          .get(`/inventory/check-stock/${item.productId}/${item.variantSku ?? 'null'}`, {
            params: { quantity: item.quantity },
          })
          .then(r => r.data.data as { available: number; reserved: number; canBuy: boolean }),
      enabled: !!item.productId,
      staleTime: 30 * 1000,
      retry: false,
    })),
  })

  // Map itemId -> stock info
  const stockMap = Object.fromEntries(
    items.map((item, idx) => [item.id, stockQueries[idx]?.data])
  )
  const hasOOSItem = items.some(item => {
    const s = stockMap[item.id]
    return s !== undefined && !s.canBuy
  })

  // Auto-cap quantities that exceed available stock (runs once per stock update)
  useEffect(() => {
    items.forEach(item => {
      const s = stockMap[item.id]
      if (s && s.available > 0 && s.available < item.quantity) {
        updateQuantity(item.id, s.available)
        warningToast(
          `${item.name}: Chỉ còn ${s.available} sản phẩm, đã tự điều chỉnh số lượng`,
          'Điều chỉnh giỏ hàng'
        )
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(stockMap)])
  
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = items.length > 0 ? 0 : 0 // Miễn phí vận chuyển
  const finalTotal = totalPrice + shippingFee

  const handleCheckout = () => {
    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    navigate('/products')
  }

  // Delete item handlers
  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId)
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      const itemName = itemToDeleteInfo?.name || 'Sản phẩm'
      removeItem(itemToDelete)
      setShowConfirmDelete(false)
      setItemToDelete(null)
      successToast(`${itemName} đã được xóa khỏi giỏ hàng`, 'Thành công')
    }
  }

  const handleCancelDelete = () => {
    setShowConfirmDelete(false)
    setItemToDelete(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden" style={{
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
    }}>
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px',
      }} />

      {/* Content */}
      <div className="relative z-10">
        {/* ==================== STEPPER ==================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Stepper
            steps={[
              { label: 'Giỏ hàng', description: 'Kiểm tra sản phẩm' },
              { label: 'Thanh toán', description: 'Nhập thông tin' },
              { label: 'Hoàn thành', description: 'Xác nhận đơn hàng' },
            ]}
            currentStep={0}
          />
        </div>

        {/* ==================== MAIN CONTENT ==================== */}
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Title Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-black text-white">Giỏ hàng của bạn</h1>
          </div>
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-black text-white">Tóm tắt đơn hàng</h2>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ==================== LEFT COLUMN - PRODUCTS ==================== */}
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
                <p className="text-slate-400 mb-6">Giỏ hàng của bạn đang trống</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleContinueShopping}
                >
                  Tiếp tục mua sắm
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg bg-slate-800"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">SKU: {item.sku}</p>
                        
                        {item.variant && (
                          <p className="text-sm text-indigo-400 font-semibold mt-2">
                            {item.variant}
                          </p>
                        )}
                        
                        {item.warranty && (
                          <p className="text-sm text-slate-300 mt-1">
                            Bảo hành: {item.warranty}
                          </p>
                        )}

                        {/* Price Info */}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-lg text-slate-400">
                            {item.quantity} x
                          </span>
                          <span className="text-lg font-black text-indigo-400">
                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        {/* Stock warning */}
                        {(() => {
                          const s = stockMap[item.id]
                          if (!s) return null
                          if (s.available === 0) return (
                            <div className="flex items-center gap-1 mt-2 text-red-400 text-xs font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              Hết hàng — vui lòng xóa sản phẩm này
                            </div>
                          )
                          if (!s.canBuy) return (
                            <div className="flex items-center gap-1 mt-2 text-yellow-400 text-xs font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              Chỉ còn {s.available} sản phẩm
                            </div>
                          )
                          return null
                        })()}                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex flex-col items-end gap-3">
                        {/* Remove */}
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-slate-500 hover:text-red-500 transition-colors p-2"
                          title="Xóa khỏi giỏ"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        {/* Quantity */}
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-slate-700 rounded transition-colors font-bold"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-white font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-slate-700 rounded transition-colors font-bold"
                          >
                            +
                          </button>
                          
                        </div>

                        {/* Remove */}
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ==================== RIGHT COLUMN - SUMMARY ==================== */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sticky top-20 space-y-4">
              {/* Summary Items */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Tạm tính:</span>
                  <span className="text-white font-bold">
                    {totalPrice.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4 border-b border-slate-800">
                <span className="text-white font-bold">Tổng cộng:</span>
                <span className="text-2xl font-black text-cyan-400">
                  {finalTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {/* Checkout Button */}
              {hasOOSItem && (
                <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Một số sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng. Vui lòng kiểm tra lại.
                </div>
              )}
              <Button
                onClick={handleCheckout}
                disabled={items.length === 0 || hasOOSItem}
                variant="primary"
                size="md"
                className="w-full"
              >
                Tiến hành thanh toán →
              </Button>

              {/* Continue Shopping */}
              <Button
                onClick={handleContinueShopping}
                variant="secondary"
                size="md"
                className="w-full"
              >
                ← Tiếp tục mua sắm
              </Button>

              {/* Trust Badge */}
              <div className="bg-slate-800 rounded p-3 text-center text-xs text-slate-400">
                ✓ Thanh toán bảo mật 100%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ==================== CONFIRM DELETE DIALOG ==================== */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Xóa sản phẩm"
        message={
          itemToDeleteInfo ? (
            <div className="text-left">
              <p>Bạn có chắc chắn muốn xóa <strong className="text-white">{itemToDeleteInfo.name}</strong> khỏi giỏ hàng không?</p>
              <p className="text-xs text-slate-500 mt-2">Hành động này không thể hoàn tác.</p>
            </div>
          ) : (
            'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?'
          )
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  )
}

export default CartPage
