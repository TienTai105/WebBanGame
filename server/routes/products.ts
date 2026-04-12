import { Router } from 'express'
import { asyncHandler, protect, adminOnly } from '../middleware/auth.js'
import * as productController from '../controllers/productController.js'

const router = Router()

// Public routes
router.get('/', asyncHandler(productController.getProducts))
router.get('/trending', asyncHandler(productController.getTrendingProducts))
router.get('/best-sellers', asyncHandler(productController.getBestSellers))
router.get('/tag/:tag', asyncHandler(productController.getProductsByTag))
router.get('/category/:category', asyncHandler(productController.getProductsByCategory))
router.get('/slug/:slug', asyncHandler(productController.getProductBySlug))
router.get('/:id', asyncHandler(productController.getProductById))

// Admin routes
router.post('/', protect, adminOnly, asyncHandler(productController.createProduct))
router.put('/:id', protect, adminOnly, asyncHandler(productController.updateProduct))
router.delete('/:id', protect, adminOnly, asyncHandler(productController.deleteProduct))

export default router
