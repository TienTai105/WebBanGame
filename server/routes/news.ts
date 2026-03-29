import { Router } from 'express'
import { asyncHandler, protect } from '../middleware/auth.js'
import { staffOnly, requirePermission, requireOTPVerification } from '../middleware/adminAuth.js'
import * as newsController from '../controllers/newsController.js'

const router = Router()

// ==================== PUBLIC ROUTES ====================
router.get('/', asyncHandler(newsController.getNews))
router.get('/featured', asyncHandler(newsController.getFeaturedNews))
router.get('/categories', asyncHandler(newsController.getNewsCategories))
router.get('/tags', asyncHandler(newsController.getNewsTags))
router.get('/:slug', asyncHandler(newsController.getNewsBySlug))

// ==================== ADMIN ROUTES ====================
router.post('/', protect, staffOnly, requirePermission('news'), asyncHandler(newsController.createNews))
router.get('/admin/all', protect, staffOnly, requirePermission('news'), asyncHandler(newsController.getAllNews))
router.get('/admin/:id', protect, staffOnly, requirePermission('news'), asyncHandler(newsController.getNewsDetail))
router.put('/admin/:id', protect, staffOnly, requirePermission('news'), asyncHandler(newsController.updateNews))
router.delete('/admin/:id', protect, staffOnly, requirePermission('news'), requireOTPVerification, asyncHandler(newsController.deleteNews))
router.patch('/admin/:id/publish', protect, staffOnly, requirePermission('news'), asyncHandler(newsController.publishNews))

export default router
