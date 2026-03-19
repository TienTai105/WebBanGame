import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import type { ProductResponse } from '../../services/index'
import Button from '../atomic/Button'
import Badge from '../atomic/Badge'
import Image from '../atomic/Image'
import Rating from '../atomic/Rating'
import Price from './Price'

type ProductCardVariant = 'flash-sale' | 'new-arrival' | 'best-seller' | 'default'

interface ProductCardProps {
  product: ProductResponse
  variant?: ProductCardVariant
  onAddToCart?: (productId: string) => void
  onQuickview?: (product: ProductResponse) => void
}

/**
 * Product card component with hover reveal icons
 * Icons (cart + quickview) appear on hover on the right side
 * @component
 * @example
 * <ProductCard
 *   product={product}
 *   variant="flash-sale"
 *   onAddToCart={(id) => {...}}
 *   onQuickview={(product) => {...}}
 * />
 */
const ProductCard: FC<ProductCardProps> = ({
  product,
  variant = 'default',
  onAddToCart,
  onQuickview,
}) => {
  const navigate = useNavigate()

  // Get first variant pricing if available, otherwise use product pricing
  const firstVariant = product.variants?.[0]
  const finalPrice = firstVariant?.finalPrice || product.finalPrice || 0
  const originalPrice = firstVariant?.price || product.price || 0
  const discount = firstVariant?.discount || product.discount || 0

  // Get images
  const images = product.images || []
  const mainImage = images.find((img) => img.isMain)?.url || images[0]?.url

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product._id)
  }

  const handleQuickview = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickview?.(product)
  }

  const handleProductClick = () => {
    navigate(`/products/${product._id}`)
  }

  return (
    <div
      onClick={handleProductClick}
      className={cn(
        'group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden',
        'hover:border-primary/50 transition-all duration-300',
        'cursor-pointer'
      )}
    >
      {/* Image Container with Overlay Icons */}
      <div className="relative aspect-square overflow-hidden bg-slate-800">
        <Image
          src={mainImage}
          alt={product.name}
          isHoverable
          containerClassName="w-full h-full"
          className="w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />

        {/* Fallback Icon */}
        {!mainImage && (
          <div className="w-full h-full flex items-center justify-center text-6xl text-slate-600">
            🎮
          </div>
        )}

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {/* Discount Badge */}
          {discount > 0 && (
            <Badge variant="discount">-{discount}%</Badge>
          )}

          {/* Promo Badge */}
          {variant === 'flash-sale' && (
            <Badge variant="promo">0% TRẢ GÓP</Badge>
          )}

          {/* Hot Release */}
          {product.tags?.includes('featured') && variant === 'new-arrival' && (
            <Badge variant="hot">HOT RELEASE</Badge>
          )}
        </div>

        {/* Top Right Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          {/* Cart Button - Navigate to Product Detail */}
          <Button
            variant="icon"
            icon="shopping_cart"
            onClick={handleProductClick}
            className={cn(
              'bg-primary/90 hover:bg-primary text-white',
              'p-3 rounded-full w-12 h-12',
              'opacity-0 group-hover:opacity-100',
              'transform scale-90 group-hover:scale-100',
              'transition-all duration-300'
            )}
            title="Xem chi tiết"
          />

          {/* Quickview Button */}
          <Button
            variant="icon"
            icon="visibility"
            onClick={handleQuickview}
            className={cn(
              'bg-secondary/90 hover:bg-secondary text-white',
              'p-3 rounded-full w-12 h-12',
              'opacity-0 group-hover:opacity-100',
              'transform scale-90 group-hover:scale-100',
              'transition-all duration-300'
            )}
            title="Xem nhanh"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Brand/Category */}
        {product.categoryId && (
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">
            {typeof product.categoryId === 'object' ? product.categoryId.name : product.categoryId}
          </p>
        )}

        {/* Product Name */}
        <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.ratingAverage && (
          <div className="mb-3">
            <Rating
              rating={product.ratingAverage}
              count={product.ratingCount}
              size="sm"
            />
          </div>
        )}

        {/* Price */}
        <Price
          originalPrice={originalPrice}
          finalPrice={finalPrice}
          discount={discount}
          showOriginal={discount > 0}
        />
      </div>
    </div>
  )
}

export default ProductCard
