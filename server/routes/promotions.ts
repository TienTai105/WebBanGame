import express, { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { staffOnly, requirePermission, requireOTPVerification } from '../middleware/adminAuth.js'
import {
  getAllPromotions,
  getPromotionByCode,
  validatePromotion,
  applyPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  adminGetAllPromotions,
  adminGetPromotionById,
} from '../controllers/promotionController.js'

const router: Router = express.Router()

// Admin routes (must be before /:code to avoid conflicts)
router.get('/admin/all', protect, staffOnly, requirePermission('promotions'), adminGetAllPromotions)
router.get('/admin/:id', protect, staffOnly, requirePermission('promotions'), adminGetPromotionById)
router.post('/', protect, staffOnly, requirePermission('promotions'), createPromotion)
router.put('/:id', protect, staffOnly, requirePermission('promotions'), updatePromotion)
router.delete('/:id', protect, staffOnly, requirePermission('promotions'), requireOTPVerification, deletePromotion)

// Public routes
router.get('/', getAllPromotions)
router.get('/:code', getPromotionByCode)
router.post('/validate', validatePromotion)
router.post('/apply', applyPromotion)

export default router
