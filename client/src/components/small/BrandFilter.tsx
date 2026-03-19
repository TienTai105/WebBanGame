import { FC } from 'react'

interface BrandFilterProps {
  brands: string[]
  selected: string[]
  onChange: (selectedBrands: string[]) => void
}

/**
 * Brand filter component with multi-select checkboxes
 * Allows filtering products by multiple brands
 * @component
 * @example
 * <BrandFilter
 *   brands={['ASUS ROG', 'Sony Interactive', 'Razer Blade', 'Logitech G']}
 *   selected={['Sony Interactive']}
 *   onChange={(brands) => setFilters({...filters, brands})}
 * />
 */
const BrandFilter: FC<BrandFilterProps> = ({ brands, selected, onChange }) => {
  const handleToggle = (brand: string) => {
    const isSelected = selected.includes(brand)
    const updated = isSelected
      ? selected.filter((b) => b !== brand)
      : [...selected, brand]
    onChange(updated)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">
        Thương hiệu
      </h3>
      <div className="space-y-3">
        {brands.map((brand) => (
          <label
            key={brand}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selected.includes(brand)}
              onChange={() => handleToggle(brand)}
              className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-transparent cursor-pointer"
            />
            <span className="text-sm group-hover:text-primary transition-colors">
              {brand}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default BrandFilter
