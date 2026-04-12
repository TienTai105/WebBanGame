import { Router, Request, Response } from 'express'
import { asyncHandler, protect, adminOnly } from '../middleware/auth.js'
import * as authController from '../controllers/authController.js'

const router = Router()

// Public routes
router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/refresh-token', asyncHandler(authController.refreshToken))

// Protected routes
router.post('/logout', protect, asyncHandler(authController.logout))
router.get('/me', protect, asyncHandler(authController.getCurrentUser))
router.post('/change-password', protect, asyncHandler(authController.changePassword))

export default router
