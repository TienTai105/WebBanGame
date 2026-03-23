import { FC } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../atomic'

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
  maxVisiblePages = 5,
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
    <div className="mt-12 flex justify-center gap-2">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={cn(
          'h-10 w-10 flex items-center justify-center rounded-lg border',
          'border-slate-700 text-slate-300',
          'transition-all duration-200',
          currentPage === 1
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-indigo-400/50 hover:text-indigo-400 hover:bg-indigo-500/10'
        )}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((pageNum, index) => (
        <div key={index}>
          {pageNum === '...' ? (
            <span className="h-10 w-10 flex items-center justify-center text-slate-500">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(pageNum as number)}
              className={cn(
                'h-10 w-10 flex items-center justify-center rounded-lg',
                'font-bold transition-all duration-200',
                currentPage === pageNum
                  ? 'bg-primary text-white border-0'
                  : 'border border-slate-700 text-slate-300 hover:border-indigo-400/50 hover:text-slate-100 hover:bg-slate-800/50'
              )}
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
          'h-10 w-10 flex items-center justify-center rounded-lg border',
          'border-slate-700 text-slate-300',
          'transition-all duration-200',
          currentPage === totalPages
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-indigo-400/50 hover:text-indigo-400 hover:bg-indigo-500/10'
        )}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  )
}

export default Pagination
