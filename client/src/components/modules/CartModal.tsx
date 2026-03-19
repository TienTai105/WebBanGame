import { FC } from 'react'
import { X } from 'lucide-react'
import { useCart } from '../../context/CartContext'

interface CartModalProps {
  onCheckout?: () => void
  onViewCart?: () => void
}

const CartModal: FC<CartModalProps> = ({
  onCheckout,
  onViewCart
}) => {
  // Use context instead of props
  const { items, isOpen, closeCart, updateQuantity, removeItem } = useCart()
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <>
      <style>{`
        .items-scroll {
          scrollbar-width: auto;
        }
        .items-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .items-scroll::-webkit-scrollbar-track {
          background: #33333333;
        }
        .items-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .items-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border: 3px solid transparent;
          background-clip: content-box;
        }
      `}</style>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 top-[76px] z-40 bg-black/50"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-[76px] h-[calc(100vh - 76px)] w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 pointer-events-auto overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-black text-slate-900">Giỏ Hàng</h2>
          <button
            onClick={closeCart}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-bold">Đóng</span>
          </button>
        </div>

        {/* Items List */}
        <div 
          className="items-scroll overflow-y-scroll flex flex-col gap-2 px-4 py-3"
          style={{ scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 76px - 300px)' }}
        >
          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">Giỏ hàng của bạn trống</p>
            </div>
          )}
          {items.length > 0 && (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-lg p-3 space-y-2 hover:border-slate-300 transition-colors text-sm"
                >
                  {/* Product Info */}
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                      {item.variant && (
                        <p className="text-xs text-indigo-600 font-semibold mt-1">
                          {item.variant}
                        </p>
                      )}
                      {item.warranty && (
                        <p className="text-xs text-slate-600 mt-1">
                          BẢO HÀNH: {item.warranty}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity + Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded transition-colors text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {item.price.toLocaleString('vi-VN')} ₫
                      </p>
                      <p className="text-sm font-black text-indigo-600">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 space-y-3 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Tổng số phụ:</span>
              <span className="text-xl font-black text-indigo-600">
                {totalPrice.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (onViewCart) {
                    onViewCart()
                  } else {
                    closeCart()
                  }
                }}
                className="w-full bg-primary text-white py-3 rounded-lg font-black text-sm hover:bg-slate-800 transition-colors"
              >
                Xem Giỏ Hàng
              </button>
              <button
                onClick={() => {
                  if (onCheckout) {
                    onCheckout()
                  } else {
                    closeCart()
                  }
                }}
                className="w-full bg-primary text-white py-3 rounded-lg font-black text-sm hover:bg-slate-800 transition-colors"
              >
                Thanh Toán
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default CartModal
