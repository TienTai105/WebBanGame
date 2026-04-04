import { FC, useState } from 'react'
import { useProductReviews } from '../../hooks/queries/useReviews'
import { Review } from '../../services/index'
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ReviewsSectionProps {
  productId: string
  productRating?: number
  ratingCount?: number
}

const ReviewsSection: FC<ReviewsSectionProps> = ({ 
  productId, 
  productRating = 0,
  ratingCount = 0 
}) => {
  const [page, setPage] = useState(1)
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null)
  const limit = 5
  
  const { data, isLoading } = useProductReviews(productId, page, limit)

  // Filter to only show approved reviews
  const reviews = (data?.reviews ?? []).filter((r: Review) => r.isApproved)

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-slate-500'}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="border-2 border-indigo-500/30 rounded-lg p-8 bg-gradient-to-br from-indigo-950/20 to-slate-900/20">
        <div className="text-center text-slate-400">Đang tải đánh giá...</div>
      </div>
    )
  }

  return (
    <div className="border-2 border-indigo-500/30 rounded-lg p-8 bg-gradient-to-br from-indigo-950/20 to-slate-900/20">
      {/* Header with Rating Stats */}
      <div className="mb-8 pb-8 border-b border-indigo-500/20">
        <h3 className="text-2xl font-black text-white mb-6">ĐÁNH GIÁ & BÌNH LUẬN</h3>
        
        {/* Rating Summary */}
        <div className="flex items-center gap-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="text-5xl font-black text-cyan-400 mb-2">
              {productRating.toFixed(1)}
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= Math.round(productRating) ? 'text-yellow-400 text-xl' : 'text-slate-600 text-xl'}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-sm text-slate-400">
              {ratingCount} đánh giá
            </div>
          </div>

          {/* Rating Scale */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r: Review) => r.rating === stars).length
              const percent = ratingCount ? (count / ratingCount) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 w-6">{stars}★</span>
                  <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6 mb-8">
        {reviews.length > 0 ? (
          reviews.slice(0, limit).map((review: Review) => (
            <div
              key={review._id}
              className="border border-indigo-500/20 rounded-lg p-6 bg-indigo-950/10 hover:border-cyan-400/30 transition-colors"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <p className="font-bold text-white">{review.user.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="text-right">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Variant Info */}
              {review.variant && (
                <div className="mb-3 px-3 py-2 bg-indigo-900/30 rounded border border-indigo-500/20 inline-block">
                  <p className="text-xs text-slate-400">
                    Phiên bản: <span className="text-indigo-300 font-bold">{review.variant.name}</span>
                  </p>
                </div>
              )}

              {/* Review Title */}
              {review.title && (
                <h4 className="text-lg font-bold text-white mb-2">{review.title}</h4>
              )}

              {/* Review Comment with Read More */}
              {review.comment && (
                <div className="mb-4">
                  <p className={cn(
                    'text-slate-300 leading-relaxed',
                    expandedReviewId !== review._id && review.comment.length > 200
                      ? 'line-clamp-3'
                      : ''
                  )}>
                    {review.comment}
                  </p>
                  {review.comment.length > 200 && (
                    <button
                      onClick={() => setExpandedReviewId(expandedReviewId === review._id ? null : review._id)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-bold mt-2 transition-colors"
                    >
                      {expandedReviewId === review._id ? '▼ Ẩn' : '▶ Xem thêm'}
                    </button>
                  )}
                </div>
              )}

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review ${idx + 1}`}
                      className="w-16 h-16 rounded object-cover border border-indigo-500/20"
                    />
                  ))}
                </div>
              )}

              {/* Helpful Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-indigo-500/10">
                <span className="text-sm text-slate-400">Hữu ích?</span>
                <button className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-slate-300 hover:text-cyan-300 transition-all text-sm">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpful?.yes || 0}</span>
                </button>
                <button className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-slate-300 hover:text-red-300 transition-all text-sm">
                  <ThumbsDown className="w-4 h-4" />
                  <span>{review.helpful?.no || 0}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Chưa có đánh giá nào cho sản phẩm này</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && (data.total ?? 0) > limit && (
        <div className="flex items-center justify-between pt-6 border-t border-indigo-500/20">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded border-2 transition-all font-bold',
              page === 1
                ? 'border-slate-600/30 text-slate-500 bg-slate-900/20 cursor-not-allowed'
                : 'border-indigo-500/50 text-indigo-300 hover:border-cyan-400/50 hover:bg-indigo-500/10'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </button>

          <div className="text-slate-400 text-sm">
            Trang {page} / {Math.ceil((data.total ?? 0) / limit)}
          </div>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil((data.total ?? 0) / limit)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded border-2 transition-all font-bold',
              page >= Math.ceil((data.total ?? 0) / limit)
                ? 'border-slate-600/30 text-slate-500 bg-slate-900/20 cursor-not-allowed'
                : 'border-indigo-500/50 text-indigo-300 hover:border-cyan-400/50 hover:bg-indigo-500/10'
            )}
          >
            Tiếp
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewsSection
