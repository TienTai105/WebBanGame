import { Router } from 'express'
import { asyncHandler, protect } from '../middleware/auth.js'
import * as userController from '../controllers/userController.js'

const router = Router()

// Protected routes - all require authentication
router.get('/profile', protect, asyncHandler(userController.getShippingAddresses)) // Getting all user info
router.put('/profile', protect, asyncHandler(userController.updateProfile))
router.post('/shipping-address', protect, asyncHandler(userController.addShippingAddress))
router.put('/shipping-address/:addressId', protect, asyncHandler(userController.updateShippingAddress))
router.delete('/shipping-address/:addressId', protect, asyncHandler(userController.deleteShippingAddress))
router.get('/shipping-addresses', protect, asyncHandler(userController.getShippingAddresses))

export default router
