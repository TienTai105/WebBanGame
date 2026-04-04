import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { reviewService, Review, ReviewsListResponse } from '../../services/index'

// Hook for getting product reviews
export const useProductReviews = (
  productId: string,
  page: number = 1,
  limit: number = 10
): UseQueryResult<ReviewsListResponse> => {
  return useQuery({
    queryKey: ['reviews', productId, page, limit],
    queryFn: () =>
      reviewService
        .getProductReviews(productId, page, limit)
        .then((res) => res.data.data),
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!productId, // Only run query if productId exists
  })
}

// Hook for getting single review
export const useReview = (reviewId: string): UseQueryResult<Review> => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () =>
      reviewService
        .getReviewById(reviewId)
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!reviewId,
  })
}
