import { FC, useState } from 'react'
import Breadcrumb from '../atomic/Breadcrumb'
import Pagination from '../modules/Pagination'
import ProductCard from '../small/ProductCard'
import { useProducts, ProductListFilters, usePlatforms, useCategories } from '../../hooks/queries/useProducts'
import { cn } from '../../utils/cn'
import { Checkbox } from '../ui/checkbox'
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
  // Mock data - in production, fetch from backend
  const AVAILABLE_BRANDS = ['ASUS ROG', 'Sony Interactive', 'Razer Blade', 'Logitech G']

  // Fetch platforms and categories from API
  const { data: platformsData = [] } = usePlatforms()
  const { data: categoriesData = [] } = useCategories()

  // Filter state - now stores platform IDs instead of names
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    platforms: [], // Now stores IDs, not names
    priceRange: { min: 0, max: 50000000 },
    categoryId: undefined,
    sortBy: 'newest',
    page: 1,
  })

  // Fetch products with current filters (server-side filtering)
  const queryFilters: ProductListFilters = {
    ...(filters.brands.length > 0 && { brand: filters.brands }),
    ...(filters.platforms.length > 0 && { platforms: filters.platforms }),
    ...(filters.categoryId && { category: filters.categoryId }),
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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12">
        {/* Breadcrumb - Auto-generated from route */}
        <Breadcrumb autoGenerate={true} />

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-8 bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 space-y-6 shadow-lg shadow-indigo-500/10">
              <h2 className="text-lg font-black flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">filter_alt</span>
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Bộ lọc</span>
              </h2>

              {/* Filters Wrapper */}
              <div className="space-y-7">
                {/* Brand Filter */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    Thương hiệu
                  </h3>
                  <div className="space-y-3">
                    {AVAILABLE_BRANDS.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-3 cursor-pointer group px-3 py-2 rounded-lg hover:bg-indigo-500/10 transition-colors"
                      >
                        <Checkbox
                          checked={filters.brands.includes(brand)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({ ...filters, brands: [...filters.brands, brand], page: 1 })
                            } else {
                              setFilters({
                                ...filters,
                                brands: filters.brands.filter((b) => b !== brand),
                                page: 1,
                              })
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {brand}
                        </span>
                      </label>
                    ))}
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
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-medium text-slate-300 whitespace-nowrap">Sắp xếp:</span>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sortBy: e.target.value as FilterState['sortBy'],
                  })
                }
                className={cn(
                  'flex-1 sm:flex-none bg-indigo-900/30 border border-indigo-400/50',
                  'rounded-lg text-sm text-white placeholder-slate-400',
                  'focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30',
                  'transition-all duration-200',
                  'px-3 py-2.5 cursor-pointer hover:bg-indigo-900/50'
                )}
              >
                <option value="newest">Mới nhất</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
                <option value="bestSellers">Bán chạy nhất</option>
              </select>
            </div>
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
    </main>
  )
}

export default ProductListPage
