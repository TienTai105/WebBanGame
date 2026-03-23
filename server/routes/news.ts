import { Router } from 'express'
import { asyncHandler, protect, adminOnly } from '../middleware/auth.js'
import * as newsController from '../controllers/newsController.js'

const router = Router()

// ==================== PUBLIC ROUTES ====================
router.get('/', asyncHandler(newsController.getNews))
router.get('/featured', asyncHandler(newsController.getFeaturedNews))
router.get('/categories', asyncHandler(newsController.getNewsCategories))
router.get('/tags', asyncHandler(newsController.getNewsTags))
router.get('/:slug', asyncHandler(newsController.getNewsBySlug))

// ==================== ADMIN ROUTES ====================
router.post('/', protect, adminOnly, asyncHandler(newsController.createNews))
router.get('/admin/all', protect, adminOnly, asyncHandler(newsController.getAllNews))
router.get('/admin/:id', protect, adminOnly, asyncHandler(newsController.getNewsDetail))
router.put('/admin/:id', protect, adminOnly, asyncHandler(newsController.updateNews))
router.delete('/admin/:id', protect, adminOnly, asyncHandler(newsController.deleteNews))
router.patch('/admin/:id/publish', protect, adminOnly, asyncHandler(newsController.publishNews))

export default router
