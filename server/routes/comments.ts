import { Router } from 'express'
import {
  createComment,
  getCommentsByNews,
  getCommentCount,
  deleteComment,
  updateCommentStatus,
  getAllComments,
  getCommentStats,
} from '../controllers/commentController.js'
import { protect } from '../middleware/auth.js'
import { staffOnly, requirePermission, requireOTPVerification } from '../middleware/adminAuth.js'

const router = Router()

// Public routes
router.post('/comments', createComment)
router.get('/comments/:newsId', getCommentsByNews)
router.get('/comments/:newsId/count', getCommentCount)

// Admin/Staff routes (require auth + comments permission)
router.get('/admin/comments', protect, staffOnly, requirePermission('comments'), getAllComments)
router.get('/admin/comments/stats', protect, staffOnly, requirePermission('comments'), getCommentStats)
router.patch('/admin/comments/:commentId/status', protect, staffOnly, requirePermission('comments'), updateCommentStatus)
router.delete('/admin/comments/:commentId', protect, staffOnly, requirePermission('comments'), requireOTPVerification, deleteComment)

export default router
