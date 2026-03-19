import { Request, Response, NextFunction } from 'express'
import Review from '../models/Review.js'
import Product from '../models/Product.js'

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
  const { productId, rating, title, comment, images } = req.body
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

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({ user: userId, product: productId })
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You already reviewed this product',
    })
  }

  const review = await Review.create({
    user: userId,
    product: productId,
    rating,
    title: title || '',
    comment: comment || '',
    images: images || [],
  })

  // Update product rating
  const allReviews = await Review.find({ product: productId })
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: avgRating,
    ratingCount: allReviews.length,
  })

  await review.populate('user', 'name avatar')

  res.status(201).json({
    success: true,
    data: review,
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

  // Update product rating
  const allReviews = await Review.find({ product: review.product })
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

  await Product.findByIdAndUpdate(review.product, {
    ratingAverage: avgRating,
    ratingCount: allReviews.length,
  })

  await review.populate('user', 'name avatar')

  res.status(200).json({
    success: true,
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

  // Update product rating
  const allReviews = await Review.find({ product: productId })
  if (allReviews.length > 0) {
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: avgRating,
      ratingCount: allReviews.length,
    })
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: 0,
      ratingCount: 0,
    })
  }

  res.status(200).json({
    success: true,
    message: 'Review deleted',
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
