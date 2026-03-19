import { FC, FormEvent, useState } from 'react'
import { cn } from '../../utils/cn'
import Icon from '../atomic/Icon'

interface SearchBarProps {
  /**
   * Callback when search is submitted
   */
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  /**
   * Show search button or just input
   */
  showButton?: boolean
  /**
   * Size of search bar
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

/**
 * Search bar component with icon button
 * @component
 * @example
 * <SearchBar onSearch={(query) => {...}} />
 */
const SearchBar: FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Tìm kiếm thiết bị gaming...',
  className,
  showButton = true,
  size = 'md',
}) => {
  const [query, setQuery] = useState('')

  const sizeClasses = {
    sm: 'h-9 text-sm px-3',
    md: 'h-10 text-base px-4',
    lg: 'h-12 text-base px-5',
    xl: 'h-14 text-lg px-6',
    '2xl': 'h-16 text-xl px-8',
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex-grow max-w-xl relative group', className)}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-slate-900/50 border border-slate-700 rounded-lg',
          'text-slate-100 placeholder:text-slate-500',
          'focus:ring-2 focus:ring-primary focus:border-primary',
          'transition-all duration-300 outline-none',
          sizeClasses[size],
          'shadow-[0_0_15px_rgba(99,102,241,0.1)]',
          'focus:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
        )}
      />

      {showButton && (
        <button
          type="submit"
          className={cn(
            'absolute right-2 top-2 bottom-2',
            'text-primary hover:text-secondary',
            'transition-colors px-3',
            'flex items-center justify-center'
          )}
        >
          <Icon name="search" size="xl" />
        </button>
      )}
    </form>
  )
}

export default SearchBar
