import { FC } from 'react'
import { cn } from '../../utils/cn'

interface PlatformFilterProps {
  platforms: string[]
  selected: string[]
  onChange: (selectedPlatforms: string[]) => void
}

/**
 * Platform filter component with button pills
 * Allows filtering by gaming platforms (PS5, PC, Xbox, Switch)
 * Multi-select with visual active state
 * @component
 * @example
 * <PlatformFilter
 *   platforms={['PlayStation 5', 'PC Gaming', 'Xbox Series X', 'Nintendo Switch']}
 *   selected={['PlayStation 5']}
 *   onChange={(platforms) => setFilters({...filters, platforms})}
 * />
 */
const PlatformFilter: FC<PlatformFilterProps> = ({
  platforms,
  selected,
  onChange,
}) => {
  const handleToggle = (platform: string) => {
    const isSelected = selected.includes(platform)
    const updated = isSelected
      ? selected.filter((p) => p !== platform)
      : [...selected, platform]
    onChange(updated)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">
        Nền tảng
      </h3>
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => handleToggle(platform)}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-xs font-medium',
              'transition-all duration-200',
              selected.includes(platform)
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary'
            )}
          >
            {platform}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PlatformFilter
