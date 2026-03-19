import express from 'express'
import {
  getProductReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
} from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/product/:productId', getProductReviews)
router.get('/:id', getReviewById)

// Protected routes (user)
router.post('/', protect, createReview)
router.put('/:id', protect, updateReview)
router.delete('/:id', protect, deleteReview)
router.post('/:id/helpful', protect, markHelpful)

export default router
