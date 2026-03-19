import { FC } from 'react'
import BrandFilter from '../small/BrandFilter'
import PlatformFilter from '../small/PlatformFilter'
import PriceRangeFilter from '../small/PriceRangeFilter'
import CategoryFilter from '../small/CategoryFilter'

interface Category {
  id: string
  name: string
}

interface PriceRange {
  min: number
  max: number
}

interface FilterSidebarProps {
  brands: string[]
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void

  platforms: string[]
  selectedPlatforms: string[]
  onPlatformsChange: (platforms: string[]) => void

  priceRange: PriceRange
  onPriceRangeApply: (range: PriceRange) => void

  categories: Category[]
  selectedCategoryId?: string
  onCategoryChange: (categoryId: string | undefined) => void
}

/**
 * Filter sidebar component combining all filter types
 * Contains brand, platform, price range, and category filters
 * @component
 * @example
 * <FilterSidebar
 *   brands={['ASUS ROG', 'Sony', 'Razer', 'Logitech']}
 *   selectedBrands={filters.brands}
 *   onBrandsChange={(b) => setFilters({...filters, brands: b})}
 *   {...otherProps}
 * />
 */
const FilterSidebar: FC<FilterSidebarProps> = ({
  brands,
  selectedBrands,
  onBrandsChange,
  platforms,
  selectedPlatforms,
  onPlatformsChange,
  priceRange,
  onPriceRangeApply,
  categories,
  selectedCategoryId,
  onCategoryChange,
}) => {
  return (
    <aside className="w-full md:w-64 shrink-0 space-y-8">
      {/* Filter Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            filter_alt
          </span>
          Bộ lọc tìm kiếm
        </h2>
      </div>

      {/* Filter Groups */}
      <div className="space-y-6">
        {/* Brand Filter */}
        <BrandFilter
          brands={brands}
          selected={selectedBrands}
          onChange={onBrandsChange}
        />

        {/* Platform Filter */}
        <PlatformFilter
          platforms={platforms}
          selected={selectedPlatforms}
          onChange={onPlatformsChange}
        />

        {/* Price Range Filter */}
        <PriceRangeFilter
          priceRange={priceRange}
          onApply={onPriceRangeApply}
        />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onChange={onCategoryChange}
        />
      </div>
    </aside>
  )
}

export default FilterSidebar
