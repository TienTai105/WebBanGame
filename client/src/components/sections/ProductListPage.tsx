import { FC, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Breadcrumb from '../atomic/Breadcrumb'
import Pagination from '../modules/Pagination'
import ProductCard from '../small/ProductCard'
import { useProducts, ProductListFilters, usePlatforms, useCategories } from '../../hooks/queries/useProducts'
import { cn } from '../../utils/cn'
import { Icon } from '../atomic'
import { Slider } from '../ui/slider'

interface PriceRange {
  min: number
  max: number
}

interface FilterState {
  brands: string[]
  platforms: string[]
  priceRange: PriceRange
  categoryId?: string
  onSale: boolean // Filter sản phẩm có discount > 0
  isNew: boolean // Filter sản phẩm tạo trong 30 ngày
  isBestseller: boolean // Filter sản phẩm bán chạy (sales > 0)
  sortBy: 'newest' | 'priceAsc' | 'priceDesc' | 'bestSellers'
  page: number
}

/**
 * Product listing page with filters and pagination
 * Combines sidebar filters with product grid display
 * Features: brand filtering, platform selection, price range, category, sorting, pagination
 * @component
 */
const ProductListPage: FC = () => {
  // Get URL query params
  const [searchParams] = useSearchParams()
  
  // Fetch platforms and categories from API
  const { data: platformsData = [] } = usePlatforms()
  const { data: categoriesData = [] } = useCategories()
  const sortDetailsRef = useRef<HTMLDetailsElement>(null)

  // Filter state - now stores platform IDs instead of names
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    platforms: [], // Now stores IDs, not names
    priceRange: { min: 0, max: 50000000 },
    categoryId: undefined,
    onSale: false,
    isNew: false,
    isBestseller: false,
    sortBy: 'newest',
    page: 1,
  })

  // Apply filter from URL query params on mount and when data changes
  useEffect(() => {
    const platformParam = searchParams.get('platform')
    const categoryParam = searchParams.get('category')
    let sortParam = searchParams.get('sort')
    const isNewParam = searchParams.get('isNew')
    const onSaleParam = searchParams.get('onSale')
    const isBestsellerParam = searchParams.get('isBestseller')

    // Normalize sort param: best-sellers → bestSellers
    if (sortParam === 'best-sellers') {
      sortParam = 'bestSellers'
    }

    // Apply isNew filter from URL
    if (isNewParam === 'true') {
      setFilters((prev) => ({
        ...prev,
        isNew: true,
      }))
    }

    // Apply onSale filter from URL
    if (onSaleParam === 'true') {
      setFilters((prev) => ({
        ...prev,
        onSale: true,
      }))
    }

    // Apply isBestseller filter from URL
    if (isBestsellerParam === 'true') {
      setFilters((prev) => ({
        ...prev,
        isBestseller: true,
      }))
    }

    if (platformParam && platformsData.length > 0) {
      // Find platform ID by _id, name, or slug
      const matchedPlatform = platformsData.find(
        (p) => 
          p._id === platformParam || 
          p.name?.toLowerCase() === platformParam.toLowerCase() ||
          p.slug?.toLowerCase() === platformParam.toLowerCase()
      )
      console.log('platformParam:', platformParam, 'platformsData:', platformsData, 'matched:', matchedPlatform)
      if (matchedPlatform && !filters.platforms.includes(matchedPlatform._id)) {
        setFilters((prev) => ({
          ...prev,
          platforms: [matchedPlatform._id],
        }))
      }
    }

    if (categoryParam && categoriesData.length > 0) {
      // Find category ID by _id, name, or slug
      const matchedCategory = categoriesData.find(
        (c) => 
          c._id === categoryParam || 
          c.name?.toLowerCase() === categoryParam.toLowerCase() ||
          c.slug?.toLowerCase() === categoryParam.toLowerCase()
      )
      console.log('categoryParam:', categoryParam, 'categoriesData:', categoriesData, 'matched:', matchedCategory)
      if (matchedCategory && filters.categoryId !== matchedCategory._id) {
        setFilters((prev) => ({
          ...prev,
          categoryId: matchedCategory._id,
        }))
      }
    }

    if (sortParam) {
      const validSorts = ['newest', 'priceAsc', 'priceDesc', 'bestSellers']
      if (validSorts.includes(sortParam as any)) {
        setFilters((prev) => ({
          ...prev,
          sortBy: sortParam as any,
          // Auto-enable bestseller filter when sorting by best sellers
          isBestseller: sortParam === 'bestSellers' ? true : prev.isBestseller,
        }))
      }
    }
  }, [searchParams, platformsData, categoriesData])

  // Fetch products with current filters (server-side filtering)
  const queryFilters: ProductListFilters = {
    ...(filters.brands.length > 0 && { brand: filters.brands }),
    ...(filters.platforms.length > 0 && { platforms: filters.platforms }),
    ...(filters.categoryId && { category: filters.categoryId }),
    ...(filters.onSale && { hasDiscount: 'true' }),
    ...(filters.isNew && { isNew: 'true' }),
    ...(filters.isBestseller && { isBestseller: 'true' }),
    // Only send price filter if user explicitly changed it from defaults
    ...(filters.priceRange.min > 0 || filters.priceRange.max < 50000000 ? { 
      minPrice: filters.priceRange.min,
      maxPrice: filters.priceRange.max 
    } : {}),
    sort: filters.sortBy,
  }

  const { data, isLoading, error } = useProducts(filters.page, 12, undefined, queryFilters)
  const products = data?.products || []
  const totalProducts = data?.total || 0
  const totalPages = Math.ceil(totalProducts / 12)

  const displayProducts = products

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden" style={{
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
      }}/>
      {/* Content */}
      <div className="relative z-10">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12">
        {/* Breadcrumb - Auto-generated from route */}
        <Breadcrumb autoGenerate={true} />

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter */}
          <div className="w-full lg:w-80 shrink-0 self-start">
            <div className="sticky top-4 bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 space-y-6 shadow-indigo-500/10">
              <h2 className="text-lg font-black flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">filter_alt</span>
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Bộ lọc</span>
              </h2>

              {/* Filters Wrapper */}
              <div className="space-y-7">
                {/* Product Type Filter */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    Loại Sản Phẩm
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          onSale: !filters.onSale,
                          page: 1,
                        })
                      }
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg',
                        'transition-all duration-200 text-left text-sm font-medium',
                        filters.onSale
                          ? 'bg-gradient-to-r from-red-500/30 to-orange-500/20 text-orange-300 border border-orange-400/50 shadow-lg shadow-red-500/20'
                          : 'hover:bg-indigo-500/10 text-slate-300 hover:text-slate-100 border border-indigo-400/20 hover:border-indigo-400/50'
                      )}
                    >
                      <span> Giảm Giá</span>
                      <span className="material-symbols-outlined text-base text-orange-400">local_fire_department</span>
                    </button>
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          isNew: !filters.isNew,
                          page: 1,
                        })
                      }
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg',
                        'transition-all duration-200 text-left text-sm font-medium',
                        filters.isNew
                          ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/20 text-yellow-300 border border-yellow-400/50 shadow-lg shadow-yellow-500/20'
                          : 'hover:bg-indigo-500/10 text-slate-300 hover:text-slate-100 border border-indigo-400/20 hover:border-indigo-400/50'
                      )}
                    >
                      <span>Mới</span>
                      <span className="material-symbols-outlined text-base text-yellow-400">stars</span>
                    </button>
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          isBestseller: !filters.isBestseller,
                          page: 1,
                        })
                      }
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg',
                        'transition-all duration-200 text-left text-sm font-medium',
                        filters.isBestseller
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/20 text-pink-300 border border-pink-400/50 shadow-lg shadow-purple-500/20'
                          : 'hover:bg-indigo-500/10 text-slate-300 hover:text-slate-100 border border-indigo-400/20 hover:border-indigo-400/50'
                      )}
                    >
                      <span>Bán Chạy</span>
                      <span className="material-symbols-outlined text-base text-pink-400">trending_up</span>
                    </button>
                  </div>
                </div>

                {/* Platform Filter */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    Nền tảng
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {platformsData.map((platform) => (
                      <button
                        key={platform._id}
                        onClick={() => {
                          const updated = filters.platforms.includes(platform._id)
                            ? filters.platforms.filter((p) => p !== platform._id)
                            : [...filters.platforms, platform._id]
                          setFilters({ ...filters, platforms: updated, page: 1 })
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-medium',
                          'transition-all duration-200',
                          filters.platforms.includes(platform._id)
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/30'
                            : 'border-indigo-400/30 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-indigo-500/10'
                        )}
                      >
                        {platform.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    Khoảng giá
                  </h3>
                  <div className="space-y-3">
                    <Slider
                      defaultValue={[filters.priceRange.min, filters.priceRange.max]}
                      min={0}
                      max={50000000}
                      step={100000}
                      onValueChange={(value) => {
                        setFilters({
                          ...filters,
                          priceRange: { min: value[0], max: value[1] },
                          page: 1,
                        })
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 px-1">
                      <span>{filters.priceRange.min.toLocaleString('vi-VN')} ₫</span>
                      <span>{filters.priceRange.max.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    Danh mục
                  </h3>
                  <div className="space-y-2">
                    {categoriesData.map((category) => (
                      <button
                        key={category._id}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            categoryId: filters.categoryId === category._id ? undefined : category._id,
                            page: 1,
                          })
                        }
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg',
                          'transition-all duration-200 text-left text-sm font-medium',
                          filters.categoryId === category._id
                            ? 'bg-gradient-to-r from-indigo-500/30 to-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-indigo-500/20'
                            : 'hover:bg-indigo-500/10 text-slate-300 hover:text-slate-100 border border-indigo-400/20 hover:border-indigo-400/50'
                        )}
                      >
                        <span>{category.name}</span>
                        <span className="material-symbols-outlined text-base text-cyan-400">chevron_right</span>
                      </button>
                    ))}
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
          {/* Header with Title and Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <div className="inline-block mb-3">
                <span className="text-indigo-400 text-xl font-bold uppercase tracking-widest">
                  Sản Phẩm
                </span>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">
                Gaming Gear & Games
              </h1>
              <p className="text-slate-400">
                Hiển thị {displayProducts.length} sản phẩm phù hợp
              </p>
            </div>

            {/* Sort Dropdown */}
            <details ref={sortDetailsRef} className="group relative w-48">
              <summary className="flex items-center justify-between px-6 py-4 bg-slate-900/30 border border-indigo-500/30 rounded-lg text-white text-base font-medium cursor-pointer hover:border-indigo-400/50 transition list-none">
                <span className="font-medium">
                  {filters.sortBy === 'newest' && 'Mới nhất'}
                  {filters.sortBy === 'priceAsc' && 'Giá thấp đến cao'}
                  {filters.sortBy === 'priceDesc' && 'Giá cao đến thấp'}
                  {filters.sortBy === 'bestSellers' && 'Bán chạy nhất'}
                </span>
                <Icon name="expand_more" size="md" className="group-open:rotate-180 transition text-indigo-400" />
              </summary>
              <div className="absolute top-full left-0 right-0 mb-2 bg-slate-900 border border-indigo-500/30 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'newest' })
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    filters.sortBy === 'newest' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Mới nhất
                </button>
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'priceAsc' })
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    filters.sortBy === 'priceAsc' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Giá thấp đến cao
                </button>
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'priceDesc' })
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    filters.sortBy === 'priceDesc' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Giá cao đến thấp
                </button>
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'bestSellers' })
                    sortDetailsRef.current?.removeAttribute('open')
                  }}
                  className={`w-full text-left px-6 py-4 text-base font-medium transition border-l-2 ${
                    filters.sortBy === 'bestSellers' ? 'bg-indigo-500/20 text-indigo-400 border-l-indigo-400' : 'text-slate-300 border-l-transparent hover:bg-indigo-700/50'
                  }`}
                >
                  Bán chạy nhất
                </button>
              </div>
            </details>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-indigo-950/40 to-slate-900/40 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
              <p className="text-slate-300 text-center">
                <span className="text-5xl mb-4 block animate-spin">⏳</span>
                Đang tải sản phẩm...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-red-950/40 to-slate-900/40 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/20">
              <p className="text-red-300 text-center">
                <span className="text-5xl mb-4 block">⚠️</span>
                Lỗi tải dữ liệu
              </p>
            </div>
          )}

          {/* Product Grid */}
          {!isLoading && !error && displayProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    variant="default"
                    onAddToCart={() => console.log('Add to cart', product._id)}
                    onQuickview={() => console.log('Quickview', product._id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={(page) =>
                    setFilters({ ...filters, page })
                  }
                />
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && displayProducts.length === 0 && (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-indigo-950/40 to-slate-900/40 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
              <p className="text-slate-300 text-center">
                <span className="text-5xl mb-4 block">🎮</span>
                Không có sản phẩm phù hợp
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</main>
  )
}

export default ProductListPage
