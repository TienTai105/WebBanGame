import { FC } from 'react'
import { cn } from '../../utils/cn'
import { Icon } from '../atomic'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

/**
 * Pagination component with prev/next arrows and page numbers
 * Shows current page highlighted, with ellipsis for large page counts
 * @component
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalPages={12}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 */
const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 3,
}) => {
  if (totalPages <= 1) return null

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const half = Math.floor(maxVisiblePages / 2)

    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, currentPage + half)

    // Adjust if near the start
    if (currentPage <= half) {
      end = Math.min(totalPages, maxVisiblePages)
    }
    // Adjust if near the end
    if (currentPage > totalPages - half) {
      start = Math.max(1, totalPages - maxVisiblePages + 1)
    }

    // Add first page
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add last page
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1.5 py-6 flex-wrap">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center justify-center rounded-lg transition-all duration-200',
          'h-9 w-9 p-0 text-sm font-bold shrink-0',
          currentPage === 1
            ? 'bg-slate-800/50 border border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/40 hover:border-indigo-400 hover:text-indigo-300'
        )}
        title="Previous page"
      >
        <Icon name="chevron_left" size="sm" />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((pageNum, index) => (
        <div key={index}>
          {pageNum === '...' ? (
            <span className="h-9 w-6 flex items-center justify-center text-slate-500 text-xs font-bold">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(pageNum as number)}
              className={cn(
                'h-9 w-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200',
                currentPage === pageNum
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/30 border border-indigo-500/20 text-slate-300 hover:bg-indigo-600/20 hover:border-indigo-400 hover:text-indigo-400'
              )}
              title={`Go to page ${pageNum}`}
            >
              {pageNum}
            </button>
          )}
        </div>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center justify-center rounded-lg transition-all duration-200',
          'h-9 w-9 p-0 text-sm font-bold shrink-0',
          currentPage === totalPages
            ? 'bg-slate-800/50 border border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/40 hover:border-indigo-400 hover:text-indigo-300'
        )}
        title="Next page"
      >
        <Icon name="chevron_right" size="sm" />
      </button>
    </div>
  )
}

export default Pagination
