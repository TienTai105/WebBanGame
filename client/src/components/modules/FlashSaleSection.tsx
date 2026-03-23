import { FC } from 'react'
import { cn } from '../../utils/cn'
import type { ProductResponse } from '../../services/index'
import { useFlashSaleProducts } from '../../hooks/queries/useProducts'
import ProductCard from '../small/ProductCard'
import Timer from '../small/Timer'
import Link from '../atomic/Link'
import Icon from '../atomic/Icon'
interface FlashSaleSectionProps {
  saleEndTime?: Date | number
  onAddToCart?: (productId: string) => void
  onQuickview?: (product: ProductResponse) => void
  className?: string
}

/**
 * Flash sale section with timer and product grid
 * Fetches products with 'sale' tag from API
 * @component
 */
const FlashSaleSection: FC<FlashSaleSectionProps> = ({
  saleEndTime = new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
  onAddToCart,
  onQuickview,
  className,
}) => {
  // Fetch flash sale products from API (tag='sale')
  const { data: flashSaleData, isLoading, error } = useFlashSaleProducts(4)
  
  const displayProducts = flashSaleData?.products || []

  return (
    <section className={cn('py-12', className)}>
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Header with Timer */}
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-white">Flash Sale</h2>
            <Timer endTime={saleEndTime} showIcon={true} />
          </div>
          <Link to="/flash-sale" variant="primary" iconPosition="right">
            Xem tất cả <Icon name="arrow_forward" size="md" />
          </Link>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800">
            <p className="text-slate-400 text-center">
              <span className="text-4xl mb-3 block animate-spin">⏳</span>
              Đang tải sản phẩm sale...
            </p>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-red-800">
            <p className="text-red-400 text-center">
              <span className="text-4xl mb-3 block">⚠️</span>
              Lỗi tải dữ liệu: {(error as any)?.message || 'Unknown error'}
            </p>
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                variant="flash-sale"
                onAddToCart={onAddToCart}
                onQuickview={onQuickview}
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800">
            <p className="text-slate-400 text-center">
              <span className="text-4xl mb-3 block">🎮</span>
              Không có sản phẩm flash sale nào
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default FlashSaleSection
