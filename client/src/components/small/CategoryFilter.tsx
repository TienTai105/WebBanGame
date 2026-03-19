import { FC } from 'react'
import { cn } from '../../utils/cn'

interface Category {
  id: string
  name: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategoryId?: string
  onChange: (categoryId: string | undefined) => void
}

/**
 * Category filter with navigation links
 * Single-select category filter with active state highlighting
 * @component
 * @example
 * <CategoryFilter
 *   categories={[
 *     { id: '1', name: 'Máy chơi game' },
 *     { id: '2', name: 'Phụ kiện Gaming' },
 *     { id: '3', name: 'Đĩa game bản quyền' },
 *     { id: '4', name: 'Ghế & Bàn Gaming' }
 *   ]}
 *   selectedCategoryId="2"
 *   onChange={(id) => setFilters({...filters, category: id})}
 * />
 */
const CategoryFilter: FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onChange,
}) => {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">
        Danh mục
      </h3>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() =>
              onChange(selectedCategoryId === category.id ? undefined : category.id)
            }
            className={cn(
              'w-full flex items-center justify-between p-2 rounded-lg',
              'transition-all duration-200 text-left',
              selectedCategoryId === category.id
                ? 'bg-primary/5 dark:bg-primary/10'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <span
              className={cn(
                'text-sm transition-colors',
                selectedCategoryId === category.id
                  ? 'text-primary font-medium'
                  : 'group-hover:text-primary'
              )}
            >
              {category.name}
            </span>
            <span className={cn(
              'material-symbols-outlined text-sm transition-colors',
              selectedCategoryId === category.id ? 'text-primary' : ''
            )}>
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
