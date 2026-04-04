import { FC, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { reviewService } from '../../services/index'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useHasCompletedOrderForProduct } from '../../hooks/queries/useOrders'
import { cn } from '../../utils/cn'
import { successToast, errorToast } from '../../utils/toast'
import { Upload, X, Loader } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  onSubmitSuccess?: () => void
  onCancel?: () => void
}

const ReviewForm: FC<ReviewFormProps> = ({ 
  productId, 
  onSubmitSuccess,
  onCancel 
}) => {
  const { user, isLoading: isLoadingUser } = useCurrentUser()
  
  // Check if user has completed order for this product
  const { hasCompletedOrder, isLoading: isCheckingOrder } = useHasCompletedOrderForProduct(productId)
  
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])

  // Mutation for creating review
  const createReviewMutation = useMutation({
    mutationFn: async () => {
      return await reviewService.createReview({
        productId,
        rating,
        title,
        comment,
        images,
      })
    },
    onSuccess: () => {
      successToast('Đánh giá đã được gửi!', 'Chờ admin duyệt để hiển thị')
      setRating(0)
      setTitle('')
      setComment('')
      setImages([])
      onSubmitSuccess?.()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể gửi đánh giá'
      errorToast('Có lỗi xảy ra', message)
    },
  })

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setImages(prev => [...prev, result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!rating) {
      errorToast('Vui lòng chọn xếp hạng', '')
      return
    }

    if (!comment.trim()) {
      errorToast('Vui lòng nhập bình luận', '')
      return
    }

    if (comment.trim().length < 10) {
      errorToast('Bình luận phải có ít nhất 10 ký tự', '')
      return
    }

    createReviewMutation.mutate()
  }

  if (!user) {
    return (
      <div className="border-2 border-indigo-500/30 rounded-lg p-6 bg-gradient-to-br from-indigo-950/20 to-slate-900/20">
        <p className="text-slate-400">
          ⚠️ Vui lòng <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold">đăng nhập</a> để viết đánh giá
        </p>
      </div>
    )
  }

  if (isCheckingOrder || isLoadingUser) {
    return (
      <div className="border-2 border-indigo-500/30 rounded-lg p-6 bg-gradient-to-br from-indigo-950/20 to-slate-900/20 flex items-center gap-3">
        <Loader className="w-5 h-5 animate-spin text-indigo-400" />
        <p className="text-slate-400">Đang kiểm tra đơn hàng của bạn...</p>
      </div>
    )
  }

  if (!hasCompletedOrder) {
    return (
      <div className="border-2 border-yellow-500/30 rounded-lg p-6 bg-gradient-to-br from-yellow-950/20 to-slate-900/20">
        <div className="flex gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="text-yellow-300 font-bold mb-1">Chưa thể viết đánh giá</p>
            <p className="text-slate-400 text-sm">
              Bạn phải <span className="text-yellow-300 font-bold">mua hàng</span> chứa sản phẩm này trước khi có thể viết đánh giá.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              💡 Sau khi đặt hàng và hàng được gửi đi, bạn sẽ có thể chia sẻ đánh giá của mình.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-indigo-500/30 rounded-lg p-8 bg-gradient-to-br from-indigo-950/20 to-slate-900/20">
      <h3 className="text-2xl font-black text-white mb-6">VIẾT ĐÁNH GIÁ</h3>

      {/* Success Message - Confirmation user can review */}
      <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <p className="text-green-400 text-sm flex items-center gap-2">
          <span>✓</span>
          <span>Bạn đã hoàn thành đơn hàng! Chia sẻ đánh giá của bạn để giúp khách hàng khác.</span>
        </p>
      </div>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-indigo-300 mb-3">
          XẾP HẠNG * <span className="text-red-400">(Bắt buộc)</span>
        </label>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className={cn(
                'text-4xl transition-all',
                (hoveredRating || rating) >= star
                  ? 'text-yellow-400 scale-110'
                  : 'text-slate-600 hover:text-yellow-400'
              )}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-cyan-300 mt-2">
            Bạn cho {rating} sao
          </p>
        )}
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-indigo-300 mb-2">
          TIÊU ĐỀ (Tùy chọn)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Sản phẩm rất tốt, giao hàng nhanh"
          maxLength={100}
          className={cn(
            'w-full px-4 py-3 bg-indigo-900/30 border-2 border-indigo-500/30 rounded-lg',
            'text-white placeholder:text-slate-500 outline-none',
            'hover:border-cyan-400/50 focus:border-cyan-400',
            'transition-colors'
          )}
        />
        <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-indigo-300 mb-2">
          BÌNH LUẬN * <span className="text-red-400">(Tối thiểu 10 ký tự)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
          maxLength={1000}
          rows={5}
          className={cn(
            'w-full px-4 py-3 bg-indigo-900/30 border-2 border-indigo-500/30 rounded-lg',
            'text-white placeholder:text-slate-500 outline-none resize-none',
            'hover:border-cyan-400/50 focus:border-cyan-400',
            'transition-colors'
          )}
        />
        <p className="text-xs text-slate-500 mt-1">{comment.length}/1000</p>
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-indigo-300 mb-2">
          HÌNH ẢNH (Tùy chọn)
        </label>
        <div className="border-2 border-dashed border-indigo-500/30 rounded-lg p-6 bg-indigo-950/10 hover:border-cyan-400/50 transition-colors">
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <Upload className="w-8 h-8 text-indigo-400 mb-2" />
            <span className="text-sm text-slate-300">Chọn hình ảnh hoặc kéo thả</span>
            <span className="text-xs text-slate-500 mt-1">PNG, JPG tối đa 5MB</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview Images */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-24 rounded object-cover border border-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className={cn(
                    'absolute -top-2 -right-2 bg-red-500 rounded-full p-1',
                    'hover:bg-red-600 transition-colors'
                  )}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createReviewMutation.isPending}
          className={cn(
            'flex-1 px-6 py-3 rounded-lg font-bold transition-all',
            'flex items-center justify-center gap-2',
            createReviewMutation.isPending
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-600 hover:to-cyan-600'
          )}
        >
          {createReviewMutation.isPending && <Loader className="w-4 h-4 animate-spin" />}
          {createReviewMutation.isPending ? 'Đang gửi...' : 'GỬI ĐÁNH GIÁ'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-6 py-3 rounded-lg font-bold',
              'border-2 border-indigo-500/50 text-indigo-300',
              'hover:border-cyan-400/50 hover:bg-indigo-500/10',
              'transition-all'
            )}
          >
            HỦY
          </button>
        )}
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded">
        <p className="text-xs text-slate-400">
          ℹ️ Đánh giá của bạn sẽ chờ admin duyệt trước khi hiển thị trên sản phẩm
        </p>
      </div>
    </form>
  )
}

export default ReviewForm
