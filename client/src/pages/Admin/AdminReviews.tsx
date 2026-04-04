import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import { CheckCircle, XCircle, Loader, Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import { successToast, errorToast } from '../../utils/toast'
import { reviewService } from '../../services/index'

interface Review {
  _id: string
  user: {
    _id: string
    name: string
    email?: string
    avatar?: string
  }
  product: {
    _id: string
    name: string
  }
  rating: number
  title: string
  comment: string
  images?: string[]
  variant?: {
    sku: string
    name: string
  }
  isApproved: boolean
  helpful?: {
    yes: number
    no: number
  }
  createdAt: string
  updatedAt: string
}

const AdminReviews: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const queryClient = useQueryClient()

  // Fetch admin reviews
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-reviews', filterStatus, page, searchQuery],
    queryFn: async () => {
      try {
        const approved = filterStatus === 'all' ? 'all' : filterStatus === 'pending' ? 'false' : 'true'
        const res = await reviewService.getAdminReviews(page, limit, approved as any, searchQuery)
        console.log('API Response Raw:', res) // Debug full response
        console.log('API Response Data:', res.data) // Debug data portion
        
        return {
          reviews: res.data?.data || [],
          total: res.data?.total || 0,
          pages: res.data?.pages || 1,
          page,
          limit,
        }
      } catch (err: any) {
        console.error('AdminReviews API Error:', err)
        console.error('Error Details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
        })
        throw err
      }
    },
  })

  // Approve review mutation
  const approveReviewMutation = useMutation({
    mutationFn: (reviewId: string) => reviewService.approveReview(reviewId),
    onSuccess: () => {
      successToast('Đánh giá đã được duyệt', '')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể duyệt đánh giá'
      errorToast('Có lỗi xảy ra', message)
    },
  })

  // Reject review mutation
  const rejectReviewMutation = useMutation({
    mutationFn: (reviewId: string) => reviewService.rejectReview(reviewId),
    onSuccess: () => {
      successToast('Đánh giá đã bị từ chối', '')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể từ chối đánh giá'
      errorToast('Có lỗi xảy ra', message)
    },
  })

  const reviews: Review[] = data?.reviews ?? []

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400 text-sm' : 'text-slate-400 text-sm'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Quản Lý Đánh Giá
        </h2>
        <AdminBreadcrumb items={[{ label: 'Đánh Giá' }]} />
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, sản phẩm..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Status */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status)
                  setPage(1)
                }}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all text-sm',
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {status === 'all' && 'Tất cả'}
                {status === 'pending' && 'Chờ duyệt'}
                {status === 'approved' && 'Đã duyệt'}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-end gap-4 text-sm">
            <div>
              <p className="text-slate-500">Tổng đánh giá</p>
              <p className="text-2xl font-bold text-slate-900">{data?.total ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 text-indigo-600 mx-auto animate-spin mb-4" />
            <p className="text-slate-500">Đang tải đánh giá...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-red-600">Lỗi: {(error as any)?.message || 'Không thể tải dữ liệu'}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Không có đánh giá nào</p>
          </div>
        )}

        {/* Reviews List */}
        {!isLoading && !error && reviews.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900">Người Dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900">Sản Phẩm</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-900">Xếp Hạng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900">Bình Luận</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-900">Trạng Thái</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-900">Ngày</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-900">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, idx) => (
                  <tr key={review._id} className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-slate-50', 'border-b border-slate-200 hover:bg-slate-100 transition-colors')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {review.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{review.user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 line-clamp-1">{review.product.name}</p>
                        {review.variant && <p className="text-xs text-slate-500 truncate">{review.variant.name}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {review.title && <span className="font-medium">{review.title}</span>}
                        {review.title && ' - '}
                        {review.comment}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                        review.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      )}>
                        {review.isApproved ? '✓ Duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-center whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!review.isApproved && (
                          <>
                            <button
                              onClick={() => approveReviewMutation.mutate(review._id)}
                              disabled={approveReviewMutation.isPending}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Duyệt"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectReviewMutation.mutate(review._id)}
                              disabled={rejectReviewMutation.isPending}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {review.isApproved && (
                          <button
                            onClick={() => rejectReviewMutation.mutate(review._id)}
                            disabled={rejectReviewMutation.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && (data?.total ?? 0) > limit && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Trang {page} / {Math.ceil((data?.total ?? 0) / limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  page === 1
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                Trước
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil((data?.total ?? 0) / limit)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  page >= Math.ceil((data?.total ?? 0) / limit)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminReviews
