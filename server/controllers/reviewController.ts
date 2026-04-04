import { Request, Response, NextFunction } from 'express'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import * as notificationService from '../services/notificationService.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

// Get reviews for a product
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sortBy = '-createdAt' } = req.query
  const productId = req.params.productId

  const pageNum = parseInt(page as string) || 1
  const limitNum = parseInt(limit as string) || 10
  const skip = (pageNum - 1) * limitNum

  const reviews = await Review.find({ product: productId })
    .populate('user', 'name avatar')
    .sort(sortBy as string)
    .skip(skip)
    .limit(limitNum)

  const total = await Review.countDocuments({ product: productId })

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    pages: Math.ceil(total / limitNum),
    data: reviews,
  })
})

// ✅ Get reviews for admin dashboard (with filtering)
export const getAdminReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, approved, search } = req.query

  const pageNum = parseInt(page as string) || 1
  const limitNum = parseInt(limit as string) || 10
  const skip = (pageNum - 1) * limitNum

  // Build filter
  const filter: any = {}
  if (approved !== undefined && approved !== 'all') {
    filter.isApproved = approved === 'true'
  }

  // Build search filter
  if (search) {
    const searchRegex = new RegExp(search as string, 'i')
    filter.$or = [
      { 'user.name': searchRegex },
      { 'product.name': searchRegex },
      { comment: searchRegex },
      { title: searchRegex },
    ]
  }

  const reviews = await Review.find(filter)
    .populate('user', 'name avatar email')
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)

  const total = await Review.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: reviews.length,
    total,
    pages: Math.ceil(total / limitNum),
    data: reviews,
  })
})

// Get review by ID
export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('product', 'name slug images')

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    })
  }

  res.status(200).json({
    success: true,
    data: review,
  })
})

// Create review (user only)
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, title, comment, images, variantSku } = req.body
  const userId = (req as any).user._id

  if (!productId || !rating) {
    return res.status(400).json({
      success: false,
      message: 'Product ID and rating are required',
    })
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
    })
  }

  // Check if product exists
  const product = await Product.findById(productId)
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    })
  }

  // ✅ CHECK: User must have completed order with this product
  const completedOrder = await Order.findOne({
    user: userId,
    'orderItems.product': productId,
    orderStatus: 'completed',
  }).populate('orderItems.product')

  if (!completedOrder) {
    return res.status(400).json({
      success: false,
      message: 'Bạn phải hoàn thành đơn hàng mới có thể đánh giá sản phẩm này',
    })
  }

  // Get variant info from order item
  const orderItem = completedOrder.orderItems.find(
    (item: any) => item.product._id.toString() === productId
  )

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({ user: userId, product: productId })
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'Bạn đã đánh giá sản phẩm này rồi',
    })
  }

  // Create review with variant info
  const review = await Review.create({
    user: userId,
    product: productId,
    variant: variantSku ? {
      sku: variantSku,
      name: orderItem?.variant || 'Default',
    } : undefined,
    rating,
    title: title || '',
    comment: comment || '',
    images: images || [],
    isApproved: false, // ← Admin must approve before showing
  })

  // ✅ AUTO-RECALCULATE: Update product rating (only count approved reviews)
  const allApprovedReviews = await Review.find({
    product: productId,
    isApproved: true,
  })

  if (allApprovedReviews.length > 0) {
    const totalRating = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allApprovedReviews.length

    await Product.findByIdAndUpdate(productId, {
      ratingAverage: parseFloat(avgRating.toFixed(1)),
      ratingCount: allApprovedReviews.length,
    })
  }

  // Re-fetch with populate to get user and product details
  const populatedReview = await Review.findById(review._id)
    .populate('user', 'name avatar')
    .populate('product', 'name')

  const productName = (populatedReview?.product as any)?.name || (orderItem?.name) || 'Unknown Product'
  const userName = (populatedReview?.user as any)?.name || 'Unknown User'

  // ✅ NOTIFY ADMIN: New review pending approval
  try {
    console.log('📢 Notifying admins about new review:', { productName, userName, rating: review.rating })
    await notificationService.notifyAdminNewReview(
      review._id.toString(),
      productName,
      userName,
      review.rating
    )
  } catch (notifError: any) {
    console.error('⚠️ Failed to send admin review notification:', notifError.message, notifError.stack)
  }

  res.status(201).json({
    success: true,
    message: 'Review tạo thành công. Chờ admin duyệt để hiển thị trên sản phẩm.',
    data: populatedReview || review,
  })
})

// Update review (user can update own)
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { rating, title, comment, images } = req.body
  const userId = (req as any).user._id

  const review = await Review.findById(req.params.id)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    })
  }

  // Check authorization
  if (review.user.toString() !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    })
  }

  // Update fields
  if (rating) review.rating = rating
  if (title !== undefined) review.title = title
  if (comment !== undefined) review.comment = comment
  if (images) review.images = images

  await review.save()

  // ✅ AUTO-RECALCULATE: Update product rating (only count approved reviews)
  const allApprovedReviews = await Review.find({
    product: review.product,
    isApproved: true,
  })

  if (allApprovedReviews.length > 0) {
    const totalRating = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allApprovedReviews.length

    await Product.findByIdAndUpdate(review.product, {
      ratingAverage: parseFloat(avgRating.toFixed(1)),
      ratingCount: allApprovedReviews.length,
    })
  }

  await review.populate('user', 'name avatar')

  res.status(200).json({
    success: true,
    message: 'Review cập nhật thành công',
    data: review,
  })
})

// Delete review (user can delete own, admin can delete any)
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    })
  }

  const userId = (req as any).user._id
  if (review.user.toString() !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    })
  }

  const productId = review.product

  await Review.findByIdAndDelete(req.params.id)

  // ✅ AUTO-RECALCULATE: Update product rating (only count approved reviews)
  const allApprovedReviews = await Review.find({
    product: productId,
    isApproved: true,
  })

  if (allApprovedReviews.length > 0) {
    const totalRating = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allApprovedReviews.length
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: parseFloat(avgRating.toFixed(1)),
      ratingCount: allApprovedReviews.length,
    })
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: 0,
      ratingCount: 0,
    })
  }

  res.status(200).json({
    success: true,
    message: 'Review xóa thành công',
  })
})

// Mark review as helpful
export const markHelpful = asyncHandler(async (req: Request, res: Response) => {
  const { helpful } = req.body

  const review = await Review.findById(req.params.id)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    })
  }

  if (helpful === true) {
    review.helpful!.yes += 1
  } else if (helpful === false) {
    review.helpful!.no += 1
  }

  await review.save()

  res.status(200).json({
    success: true,
    data: review,
  })
})

// ✅ Admin approve review
export const approveReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    })
  }

  // Mark as approved
  review.isApproved = true
  await review.save()

  // ✅ AUTO-RECALCULATE: Update product rating (now includes this approved review)
  const allApprovedReviews = await Review.find({
    product: review.product,
    isApproved: true,
  })

  if (allApprovedReviews.length > 0) {
    const totalRating = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allApprovedReviews.length

    await Product.findByIdAndUpdate(review.product, {
      ratingAverage: parseFloat(avgRating.toFixed(1)),
      ratingCount: allApprovedReviews.length,
    })
  }

  await review.populate('user', 'name avatar')
  await review.populate('product', 'name slug')

  // Send notification to user
  try {
    const userId = (review.user as any)?._id
    const productName = (review.product as any)?.name
    if (userId && productName) {
      await notificationService.notifyReviewApproved(
        userId.toString(),
        review._id.toString(),
        productName
      )
    }
  } catch (notifError: any) {
    console.error('⚠️ Failed to send review approved notification:', notifError.message)
  }

  res.status(200).json({
    success: true,
    message: 'Review approved successfully',
    data: review,
  })
})

// ✅ Admin reject review
export const rejectReview = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body
  const review = await Review.findById(req.params.id)

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found',
    })
  }

  // Mark as rejected (note: isApproved = false, could add rejection reason in future)
  review.isApproved = false
  await review.save()

  // ✅ AUTO-RECALCULATE: Update product rating (exclude this rejected review)
  const allApprovedReviews = await Review.find({
    product: review.product,
    isApproved: true,
  })

  if (allApprovedReviews.length > 0) {
    const totalRating = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allApprovedReviews.length

    await Product.findByIdAndUpdate(review.product, {
      ratingAverage: parseFloat(avgRating.toFixed(1)),
      ratingCount: allApprovedReviews.length,
    })
  } else {
    // No approved reviews left
    await Product.findByIdAndUpdate(review.product, {
      ratingAverage: 0,
      ratingCount: 0,
    })
  }

  await review.populate('user', 'name avatar')
  await review.populate('product', 'name slug')

  // Send notification to user
  try {
    const userId = (review.user as any)?._id
    const productName = (review.product as any)?.name
    if (userId && productName) {
      await notificationService.notifyReviewRejected(
        userId.toString(),
        review._id.toString(),
        productName,
        reason
      )
    }
  } catch (notifError: any) {
    console.error('⚠️ Failed to send review rejected notification:', notifError.message)
  }
  res.status(200).json({
    success: true,
    message: 'Review rejected',
    data: review,
  })
})
