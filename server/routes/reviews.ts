import express from 'express'
import {
  getProductReviews,
  getAdminReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  approveReview,
  rejectReview,
} from '../controllers/reviewController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// ✅ Admin routes (MUST come FIRST - specific routes before generic!)
router.get('/admin/all', protect, adminOnly, getAdminReviews)  // Get all reviews for admin dashboard

// Public routes
router.get('/product/:productId', getProductReviews)
router.get('/:id', getReviewById)

// More admin routes
router.put('/:id/approve', protect, adminOnly, approveReview)
router.put('/:id/reject', protect, adminOnly, rejectReview)

// Protected routes (user)
router.post('/', protect, createReview)
router.put('/:id', protect, updateReview)
router.delete('/:id', protect, deleteReview)
router.post('/:id/helpful', protect, markHelpful)

export default router
