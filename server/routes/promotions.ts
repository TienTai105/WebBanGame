import express, { Router } from 'express'
import {
  getAllPromotions,
  getPromotionByCode,
  validatePromotion,
  applyPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../controllers/promotionController'

const router: Router = express.Router()

// Public routes
router.get('/', getAllPromotions) // Lấy tất cả active promotions
router.get('/:code', getPromotionByCode) // Lấy chi tiết promotion
router.post('/validate', validatePromotion) // Validate coupon code
router.post('/apply', applyPromotion) // Record promotion usage

// Admin routes (có thể thêm auth middleware sau)
router.post('/', createPromotion) // Tạo promotion
router.put('/:id', updatePromotion) // Cập nhật promotion
router.delete('/:id', deletePromotion) // Xóa promotion

export default router
