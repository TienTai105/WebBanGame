import { FC, useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Breadcrumb from '../atomic/Breadcrumb'
import { Button } from '../atomic'
import { useProduct, useProducts } from '../../hooks/queries/useProducts'
import { useCart, CartItem } from '../../context/CartContext'
import { RadioGroup, RadioGroupItem } from '../ui/radio'
import { cn } from '../../utils/cn'
import { successToast, errorToast } from '../../utils/toast'
import { useInventory } from '../../hooks/useInventory'
import { ProductResponse } from '../../services/index'

interface SelectedState {
  variantIndex: number | null
  warranty: '3_months' | '12_months'
  quantity: number
}

/**
 * Product Detail Page - Shows full product info with variants, warranty selector, and add to cart
 * Conditional logic:
 * - GAME category: Show version selector (ASIA/EURO/USA)
 * - Other categories: Show warranty selector (3/12 months)
 * - Either way: Show variant images, price, quantity, action buttons
 */
const ProductDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading, error } = useProduct(id || '')
  const { data: allProductsData } = useProducts(1, 100) // Fetch up to 100 products
  const { addItem, openCart } = useCart()

  const [selected, setSelected] = useState<SelectedState>({
    variantIndex: null,
    warranty: '3_months',
    quantity: 1,
  })

  const [carouselIndex, setCarouselIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([])

  // 📍 Scroll to top when component mounts or ID changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // Determine if product is a GAME
  const isGame = useMemo(() => {
    if (!product) return false
    return product.categoryId && 
           typeof product.categoryId === 'object' && 
           'name' in product.categoryId &&
           product.categoryId.name.toLowerCase() === 'game'
  }, [product])

  // Get active variant or fallback to product price
  const activeVariant = selected.variantIndex !== null && product?.variants 
    ? product.variants[selected.variantIndex]
    : null
  
  const basePrice = activeVariant?.finalPrice ?? product?.finalPrice ?? product?.price ?? 0
  const warrantyFee = selected.warranty === '12_months' ? 500000 : 0
  const totalPrice = (basePrice + warrantyFee) * selected.quantity

  // Stock check for the currently selected variant (or product SKU if no variants)
  const inventorySku = activeVariant?.sku ?? product?.sku ?? null
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory(
    product?._id,
    inventorySku,
    selected.quantity
  )

  // Auto-select first variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && selected.variantIndex === null) {
      setSelected(prev => ({ ...prev, variantIndex: 0 }))
    }
  }, [product?.variants])

  // Fetch related products - filter by genres for games, by category for non-games
  useEffect(() => {
    if (product && allProductsData?.products && isGame !== undefined) {
      let related: ProductResponse[] = []

      if (isGame) {
        // For games: filter by genres
        if (product.genres && product.genres.length > 0) {
          related = allProductsData.products.filter((p: ProductResponse) => {
            if (p._id === product._id) return false
            // Match if product has any of the same genres
            return p.genres && p.genres.some(genre => product.genres?.includes(genre))
          })
        }
      } else {
        // For non-games (devices): filter by same category
        const currentCategoryId = typeof product.categoryId === 'object' 
          ? (product.categoryId as any)._id 
          : product.categoryId

        related = allProductsData.products.filter((p: ProductResponse) => {
          if (p._id === product._id) return false
          const pCategoryId = typeof p.categoryId === 'object'
            ? (p.categoryId as any)._id
            : p.categoryId
          return pCategoryId === currentCategoryId
        })
      }

      console.log('Related products:', {
        isGame,
        totalProducts: allProductsData.products.length,
        matchCount: related.length,
        filterCriteria: isGame ? 'genres' : 'category'
      })
      
      setRelatedProducts(related)
      setCarouselIndex(0)
    }
  }, [product, allProductsData?.products, isGame])

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url?: string): string | null => {
    if (!url) return null
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return

    // Guard: prevent adding OOS items
    if (inventoryData && !inventoryData.canBuy) {
      errorToast('Sản phẩm đã hết hàng', 'Không thể thêm vào giỏ')
      return
    }

    // Calculate warranty fee
    const warrantyFee = !isGame && selected.warranty === '12_months' ? 500000 : 0
    const cartItemPrice = basePrice + warrantyFee

    // Get variant display name (same logic as in display section)
    let variantDisplayName: string | undefined = undefined
    if (selected.variantIndex !== null && product.variants && product.variants[selected.variantIndex]) {
      const variant = product.variants[selected.variantIndex]
      variantDisplayName = isGame && (variant as any).attributes?.verson 
        ? (variant as any).attributes.verson 
        : variant.name
    }

    const cartItem: CartItem = {
      id: `${product._id}-${selected.variantIndex}-${selected.warranty}-${basePrice}`, // ID includes warranty to separate different warranty options
      productId: product._id,
      name: product.name,
      sku: product.sku,
      image: images?.[0]?.url || '/images/placeholder.png',
      price: cartItemPrice, // Price includes warranty fee
      warranty: !isGame ? (selected.warranty === '12_months' ? '12 Tháng' : '3 Tháng') : undefined,
      variant: variantDisplayName, // Add variant/version name
      variantSku: activeVariant?.sku ?? product.sku ?? null,
      quantity: selected.quantity,
    }

    addItem(cartItem)
    openCart()
    successToast(`Đã thêm ${product.name} vào giỏ hàng`, 'Thêm vào giỏ thành công')
  }

  const videoId = getYouTubeVideoId(product?.videoTrailerUrl)

  // Get images from active variant or product
  const images = activeVariant?.images?.length ? activeVariant.images : product?.images
  const [mainImageIndex, setMainImageIndex] = useState(0)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 text-lg">Đang tải...</p>
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Sản phẩm không tìm thấy</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="w-full max-w-7xl mx-auto px-8 sm:px-12 lg:px-20 py-14">
        {/* Breadcrumb */}
        <Breadcrumb autoGenerate={false} items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sản phẩm', href: '/products' },
          { label: product.name }
        ]} />

        {/* Product Container - Grid based on screen size */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-20">
          {/* LEFT-CENTER: Main Image with Navigation + Thumbnails Below (2-3 cols) */}
          <div className="lg:col-span-2 order-1">
            {/* Main Image with Navigation Arrows */}
            <div className="relative bg-gradient-to-br from-indigo-950/30 to-slate-900/30 rounded-lg overflow-hidden border-2 border-indigo-500/30 group">
              <img
                src={images?.[mainImageIndex]?.url || '/images/placeholder.png'}
                alt={images?.[mainImageIndex]?.alt || product.name}
                className="w-full h-auto object-cover transition-transform duration-300 ease-out group-hover:scale-125"
              />
              
              {/* Navigation Arrows */}
              {images && images.length > 1 && (
                <>
                  <button
                    onClick={() => setMainImageIndex((mainImageIndex - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 "
                  >
                    <ChevronLeft className="w-10 h-10" />
                  </button>
                  <button
                    onClick={() => setMainImageIndex((mainImageIndex + 1) % images.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 "
                  >
                    <ChevronRight className="w-10 h-10" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails Below Main Image */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images && images.length > 0 && (
                <>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImageIndex(idx)}
                      className={cn(
                        'w-full h-24 rounded-lg border-2 overflow-hidden',
                        'transition-all duration-200',
                        mainImageIndex === idx
                          ? 'border-cyan-400 shadow-lg shadow-cyan-400/30'
                          : 'border-indigo-500/30 hover:border-cyan-400/50'
                      )}
                    >
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Product Info (2 cols) */}
          <div className="lg:col-span-2 order-2 space-y-6">
            {/* Title + SKU */}
            <div>
              <h1 className="text-4xl font-black text-white mb-3">{product.name}</h1>
              <p className="text-base text-slate-400">SKU: {product.sku}</p>
            </div>

            {/* Price - Plain, No Box */}
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black text-cyan-400">
                  {basePrice.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>

            {/* Stock Badge - Dynamic from Inventory API */}
            <div>
              {inventoryLoading ? (
                <span className="inline-block bg-slate-700/40 text-slate-400 px-4 py-2 rounded-full text-base font-bold border border-slate-600/30">
                  Đang kiểm tra tồn kho...
                </span>
              ) : inventoryData ? (
                inventoryData.available === 0 ? (
                  <span className="inline-block bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-base font-bold border border-red-500/30">
                    ✗ Hết hàng
                  </span>
                ) : inventoryData.available <= 5 ? (
                  <span className="inline-block bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-base font-bold border border-yellow-500/30">
                    ⚠ Sắp hết hàng (còn {inventoryData.available})
                  </span>
                ) : (
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-base font-bold border border-emerald-500/30">
                    ✓ Còn hàng ({inventoryData.available})
                  </span>
                )
              ) : (
                <span className="inline-block bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-base font-bold border border-emerald-500/30">
                  ✓ Còn hàng
                </span>
              )}
            </div>

            {/* Warranty Selector - Only for Non-Game Products */}
            {!isGame && (
              <div>
                <p className="text-base font-bold text-indigo-300 mb-3">BẢO HÀNH *</p>
                <RadioGroup value={selected.warranty} onValueChange={(value) => setSelected({ ...selected, warranty: value as '3_months' | '12_months' })}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="3_months" id="warranty-3" />
                    <label htmlFor="warranty-3" className="text-base text-slate-300 cursor-pointer">
                      3 Tháng
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="12_months" id="warranty-12" />
                    <label htmlFor="warranty-12" className="text-base text-slate-300 cursor-pointer">
                      12 Tháng (+500.000 ₫)
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Variant Selector - For Game or if Product has Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-base font-bold text-indigo-300 mb-3">{isGame ? 'PHIÊN BẢN:' : 'PHIÊN BẢN:'}</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant, idx) => {
                    // Get version name from attributes for games, otherwise use name
                    const displayName = isGame && (variant as any).attributes?.verson 
                      ? (variant as any).attributes.verson 
                      : variant.name
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelected({ ...selected, variantIndex: idx })}
                        className={cn(
                          'px-6 py-3 rounded border-2 font-black text-base transition-all',
                          selected.variantIndex === idx
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30'
                            : 'bg-indigo-900/20 text-slate-300 border-indigo-500/30 hover:border-cyan-400/50 hover:bg-indigo-500/10'
                        )}
                      >
                        {displayName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Product Name + Price Display */}
            <div className="text-base">
              <p className="text-slate-300">
                <span className="font-bold">▸ {product.name}</span>
              </p>
              <p className="text-slate-400 text-lg">{basePrice.toLocaleString('vi-VN')} ₫</p>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-slate-300">Thành tiền:</span>
              <span className="text-cyan-400">{totalPrice.toLocaleString('vi-VN')} ₫</span>
            </div>

            {/* Quantity Selector + Buy Button */}
            <div className="space-y-2">
              <label className="text-base font-bold text-indigo-300 block">Số lượng</label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  min="1"
                  value={selected.quantity}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1
                    setSelected({ ...selected, quantity: Math.max(1, val) })
                  }}
                  onBlur={() => {
                    if (!selected.quantity || selected.quantity < 1) {
                      setSelected({ ...selected, quantity: 1 })
                    }
                  }}
                  className="w-24 px-3 py-3 bg-indigo-900/30 border-2 border-indigo-500/30 rounded-lg text-center outline-none text-white font-black text-lg hover:border-cyan-400/50 focus:border-cyan-400 transition-colors"
                />
                <Button
                  onClick={handleAddToCart}
                  disabled={!!inventoryData && !inventoryData.canBuy}
                  variant="gradient"
                  size="md"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-indigo-500/30"
                >
                  {!!inventoryData && !inventoryData.canBuy ? 'Hết hàng' : 'Mua Ngay'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Below - Full Width Stack */}
        {/* Payment Info Box */}
        <div className="border-2 border-indigo-500/30 rounded-lg p-6 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 mt-20">
          <h3 className="font-bold text-white mb-3">THÀNH TOÁN</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Tiền mặt / Chuyển khoản: Miễn phí</li>
            <li>• Thẻ ATM/Napas nội địa: + 2%</li>
            <li>• Thẻ Visa / MasterCard / JCB / CUP / Amex:</li>
            <li className="ml-4">  - Phát hành tại Việt Nam: + 3%</li>
            <li className="ml-4">  - Phát hành quốc tế - nước ngoài: + 4%</li>
            <li className="font-bold text-white mt-3">TRẢ GÓP</li>
            <li>Trả Góp: Trả trước 10% + CCCD / Bằng lái <a href="#" className="text-cyan-400">(Xem chi tiết)</a></li>
            <li>Trả Góp: Dùng thẻ tín dụng lãi suất 0% <a href="#" className="text-cyan-400">(Xem chi tiết)</a></li>
          </ul>
        </div>

        {/* Description Box */}
        <div className="border-2 border-indigo-500/30 rounded-lg p-6 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 mt-12">
          <h3 className="font-bold text-white mb-3">MÔ TẢ</h3>
          {product.description && (
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{product.description}</p>
          )}
        </div>

        {/* Video Trailer Section - Full Width */}
        {videoId && (
          <div className="border-2 border-indigo-500/30 rounded-lg p-8 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 mt-20">
            <h3 className="font-bold text-white mb-6 text-xl">VIDEO TRAILER</h3>
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="Product Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Specifications - Below accessories */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-20">
            <h3 className="text-xl font-black text-white mb-6">Thông số kỹ thuật</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex gap-4 p-3 border-b border-indigo-500/20">
                  <span className="font-bold text-indigo-300 min-w-32 capitalize text-sm">{key}:</span>
                  <span className="text-slate-300 text-sm">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products Carousel - For all products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            {/* Title */}
            <h3 className="text-2xl font-black text-white mb-8">SẢN PHẨM LIÊN QUAN</h3>
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div className="flex gap-4 transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(-${carouselIndex * (100 / 4)}%)`,
                  }}
                >
                  {relatedProducts.map((relProduct) => (
                    <div
                      key={relProduct._id}
                      className="flex-shrink-0 w-1/4 cursor-pointer group"
                      onClick={() => navigate(`/products/${relProduct._id}`)}
                    >
                      {/* Product Card */}
                      <div className="border-2 border-indigo-500/30 rounded-lg p-4 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 hover:border-cyan-400/50 transition-all h-full">
                        {/* Image */}
                        <div className="relative bg-indigo-950/30 rounded-lg overflow-hidden mb-4 h-48">
                          <img
                            src={relProduct.images?.[0]?.url || '/images/placeholder.png'}
                            alt={relProduct.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Badge */}
                          {relProduct.discount && relProduct.discount > 0 && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              -{relProduct.discount}%
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <h4 className="text-sm font-bold text-white mb-2 line-clamp-2">
                          {relProduct.name}
                        </h4>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-black text-cyan-400">
                            {(relProduct.finalPrice ?? relProduct.price ?? 0).toLocaleString('vi-VN')} ₫
                          </span>
                          {relProduct.price && relProduct.finalPrice && relProduct.price > relProduct.finalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              {relProduct.price.toLocaleString('vi-VN')} ₫
                            </span>
                          )}
                        </div>

                        {/* Rating and Stock */}
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>⭐ {relProduct.ratingAverage || 0}</span>
                          <span className="text-emerald-400">Có sẵn</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons - Only show if more than 4 products */}
              {relatedProducts.length > 4 && (
                <>
                  <button
                    onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                    className="absolute left-0 top-1/3 -translate-y-1/2 z-10 bg-indigo-500/80 hover:bg-indigo-600 p-2 rounded-full text-white transition-colors -ml-4"
                    disabled={carouselIndex === 0}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCarouselIndex(Math.min(relatedProducts.length - 4, carouselIndex + 1))}
                    className="absolute right-0 top-1/3 -translate-y-1/2 z-10 bg-indigo-500/80 hover:bg-indigo-600 p-2 rounded-full text-white transition-colors -mr-4"
                    disabled={carouselIndex >= relatedProducts.length - 4}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Pagination Dots */}
              {relatedProducts.length > 4 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.ceil(relatedProducts.length / 4) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={cn(
                        'w-3 h-3 rounded-full transition-all',
                        carouselIndex === idx
                          ? 'bg-cyan-400 w-8'
                          : 'bg-indigo-500/50 hover:bg-indigo-500'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default ProductDetailPage
