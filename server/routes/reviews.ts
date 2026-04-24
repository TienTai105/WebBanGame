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
import { protect } from '../middleware/auth.js'
import { staffOnly, requirePermission } from '../middleware/adminAuth.js'

const router = express.Router()

// ✅ Admin/staff routes (MUST come FIRST - specific routes before generic!)
router.get('/admin/all', protect, staffOnly, requirePermission('reviews'), getAdminReviews)  // Get all reviews for admin dashboard

// Public routes
router.get('/product/:productId', getProductReviews)
router.get('/:id', getReviewById)

// More admin/staff routes
router.put('/:id/approve', protect, staffOnly, requirePermission('reviews'), approveReview)
router.put('/:id/reject', protect, staffOnly, requirePermission('reviews'), rejectReview)

// Protected routes (user)
router.post('/', protect, createReview)
router.put('/:id', protect, updateReview)
router.delete('/:id', protect, deleteReview)
router.post('/:id/helpful', protect, markHelpful)

export default router
