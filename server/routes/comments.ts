import { Router } from 'express'
import {
  createComment,
  getCommentsByNews,
  getCommentCount,
  deleteComment,
  updateCommentStatus,
  getAllComments,
} from '../controllers/commentController.js'

const router = Router()

// Public routes
router.post('/comments', createComment)
router.get('/comments/:newsId', getCommentsByNews)
router.get('/comments/:newsId/count', getCommentCount)

// Admin routes
router.delete('/admin/comments/:commentId', deleteComment)
router.patch('/admin/comments/:commentId/status', updateCommentStatus)
router.get('/admin/comments', getAllComments)

export default router
