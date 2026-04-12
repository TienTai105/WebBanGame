import { FC, FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import Icon from '../atomic/Icon'

interface SearchResult {
  _id: string
  name: string
  slug: string
  image?: string
  price?: number
}

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
 * Search bar component with dropdown results
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
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: 'h-9 text-sm px-3',
    md: 'h-10 text-base px-4',
    lg: 'h-12 text-base px-5',
    xl: 'h-14 text-lg px-6',
    '2xl': 'h-16 text-xl px-8',
  }

  // Fetch search results - fetch immediately without debounce for first character
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([])
        setShowPopular(true) // Show popular when empty
        return
      }

      setShowPopular(false)
      setIsLoading(true)
      try {
        const url = `http://localhost:5000/api/products?search=${encodeURIComponent(query)}&limit=5`
        console.log('🔍 Fetching:', url) // DEBUG
        const response = await fetch(url)
        console.log('📡 Response status:', response.status) // DEBUG
        if (response.ok) {
          const data = await response.json()
          const products = data.data?.products || data.products || []
          console.log('✅ Results:', products.length, 'products') // DEBUG
          setResults(products)
          setIsOpen(true)
        } else {
          console.error('❌ API error:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce only for queries > 1 character, immediate for 1 char
    const delay = query.length === 1 ? 50 : 200
    const timer = setTimeout(fetchResults, delay)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch popular products on focus
  useEffect(() => {
    const fetchPopular = async () => {
      if (!query.trim()) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/products?sort=newest&limit=5`
          )
          if (response.ok) {
            const data = await response.json()
            const products = data.data?.products || data.products || []
            console.log('✅ Popular:', products.length, 'products')
            setResults(products)
          }
        } catch (error) {
          console.error('Failed to fetch popular products:', error)
        }
      }
    }

    if (showPopular) {
      fetchPopular()
    }
  }, [showPopular, query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query)
      navigate(`/products?search=${encodeURIComponent(query)}`)
      setIsOpen(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    navigate(`/products/${result.slug}`)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className={cn('flex-grow max-w-xl relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true)
            if (!query.trim()) {
              setShowPopular(true)
            }
          }}
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
          autoComplete="off"
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
            {isLoading ? (
              <Icon name="hourglass_empty" size="xl" />
            ) : (
              <Icon name="search" size="xl" />
            )}
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 text-center">
              <p className="text-slate-400">🔍 Đang tìm kiếm...</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              {/* Results List */}
              <div className="divide-y divide-slate-800">
                {/* Header */}
                <div className="px-4 py-2 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {showPopular ? '🔥 Sản phẩm nổi bật' : `🔍 Kết quả tìm kiếm`}
                </div>

                {/* Products */}
                {results.map((result) => (
                  <button
                    key={result._id}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-left"
                  >
                    {/* Product Image */}
                    {result.image && (
                      <img
                        src={result.image}
                        alt={result.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-100 font-medium truncate">{result.name}</p>
                    </div>

                    <Icon name="arrow_forward" size="md" className="text-slate-500" />
                  </button>
                ))}
              </div>

              {/* View All Results */}
              <button
                onClick={() => {
                  navigate(`/products?search=${encodeURIComponent(query)}`)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-center text-cyan-400 hover:bg-slate-800 font-medium transition-colors border-t border-slate-800"
              >
                Xem tất cả kết quả ({results.length}+)
              </button>
            </>
          )}

          {!isLoading && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-slate-400">Không tìm thấy sản phẩm</p>
              <p className="text-slate-500 text-xs mt-2">Thử tìm kiếm từ khác</p>
            </div>
          )}
        </div>
      )}

      {/* Popular products when focus empty */}
      {showPopular && isOpen && !query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {results.length > 0 && (
            <div className="divide-y divide-slate-800">
              {/* Header */}
              <div className="px-4 py-2 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sản phẩm nổi bật
              </div>

              {/* Popular Products */}
              {results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-left"
                >
                  {result.image && (
                    <img
                      src={result.image}
                      alt={result.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 font-medium truncate">{result.name}</p>
                  </div>

                  <Icon name="arrow_forward" size="md" className="text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
