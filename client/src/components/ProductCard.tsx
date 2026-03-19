import { FC, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductResponse } from '../services/index'

interface ProductCardProps {
  product: ProductResponse
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Get first variant pricing if available, otherwise use minPrice/maxPrice
  const firstVariant = product.variants?.[0]
  const finalPrice = firstVariant?.finalPrice || product.minPrice || 0
  const originalPrice = firstVariant?.price || product.maxPrice || 0
  const discount = firstVariant?.discount || product.discount || 0
  
  // Get images
  const images = product.images || []
  const mainImage = images.find((img: any) => img.isMain)?.url || images[0]?.url
  
  // Calculate rating and reviews
  const rating = product.ratingAverage || 4.5
  const reviewCount = product.ratingCount || 0

  // Compute total stock from variants (or top-level stock for products without variants)
  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
    : (product.stock ?? undefined)
  const hasStockInfo = product.variants
    ? product.variants.some(v => v.stock !== undefined)
    : product.stock !== undefined
  const isOutOfStock = hasStockInfo && totalStock === 0

  return (
    <Link to={`/products/${product._id}`}>
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-64 overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-5xl mb-2">🎮</span>
              <span className="text-sm">No image</span>
            </div>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              -{discount}%
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg">
                Hết hàng
              </span>
            </div>
          )}

          {/* Hot Badge */}
          {product.tags?.includes('featured') && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              🔥 HOT
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            {typeof product.categoryId === 'object' 
              ? product.categoryId.name 
              : product.categoryId || 'Category'}
          </p>

          {/* Product Name */}
          <h3 className="font-bold text-base mt-2 line-clamp-2 text-gray-800 hover:text-blue-600">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span key={i}>
                  {i < Math.floor(rating) ? '★' : i < rating ? '⭐' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-600">({reviewCount})</span>
          </div>

          {/* Price Section */}
          <div className="mt-4 flex items-end gap-2">
            <span className="text-2xl font-black text-blue-600">
              {finalPrice.toLocaleString('vi-VN')}₫
            </span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-3 flex items-center justify-between text-sm">
            {isOutOfStock ? (
              <span className="font-semibold text-red-500">✗ Hết hàng</span>
            ) : hasStockInfo && totalStock !== undefined && totalStock <= 5 ? (
              <span className="font-semibold text-yellow-500">⚠ Sắp hết ({totalStock})</span>
            ) : (
              <span className="font-semibold text-green-600">✓ Có sẵn</span>
            )}
            {product.variants && product.variants.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {product.variants.length} variant
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button 
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg"
            onClick={(e) => {
              e.preventDefault()
              // Add to cart logic here
              console.log('Add to cart:', product._id)
            }}
          >
            🛒 Thêm vào giỏ
          </button>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
