import { FC, useState } from 'react'

interface PriceRange {
  min: number
  max: number
}

interface PriceRangeFilterProps {
  priceRange: PriceRange
  onApply: (range: PriceRange) => void
}

const PriceRangeFilter: FC<PriceRangeFilterProps> = ({ priceRange, onApply }) => {
  const [minPrice, setMinPrice] = useState(priceRange.min)
  const [maxPrice, setMaxPrice] = useState(priceRange.max)

  const handleApply = () => {
    if (minPrice <= maxPrice) {
      onApply({ min: minPrice, max: maxPrice })
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-300">
        Khoảng giá
      </h3>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded border border-slate-700 bg-slate-800 text-white placeholder-slate-500 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded border border-slate-700 bg-slate-800 text-white placeholder-slate-500 text-sm"
          />
        </div>
        <button
          onClick={handleApply}
          className="w-full px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Áp dụng
        </button>
      </div>
    </div>
  )
}

export default PriceRangeFilter
