import express, { Router } from 'express'
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
} from '../controllers/promotionController'

const router: Router = express.Router()

// Admin routes (must be before /:code to avoid conflicts)
router.get('/admin/all', adminGetAllPromotions)
router.get('/admin/:id', adminGetPromotionById)
router.post('/', createPromotion)
router.put('/:id', updatePromotion)
router.delete('/:id', deletePromotion)

// Public routes
router.get('/', getAllPromotions)
router.get('/:code', getPromotionByCode)
router.post('/validate', validatePromotion)
router.post('/apply', applyPromotion)

export default router
