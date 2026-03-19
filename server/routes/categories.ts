import { Router } from 'express'
import { asyncHandler, protect, adminOnly } from '../middleware/auth.js'
import * as categoryController from '../controllers/categoryController.js'

const router = Router()

// Public routes
router.get('/', asyncHandler(categoryController.getCategories))
router.get('/:id', asyncHandler(categoryController.getCategoryById))
router.get('/level/:level', asyncHandler(categoryController.getCategoriesByLevel))

// Admin routes
router.post('/', protect, adminOnly, asyncHandler(categoryController.createCategory))
router.put('/:id', protect, adminOnly, asyncHandler(categoryController.updateCategory))
router.delete('/:id', protect, adminOnly, asyncHandler(categoryController.deleteCategory))

export default router
