import express from 'express'
import {
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrder,
  getAllOrders,
  cancelOrder,
  deleteOrder,
  confirmOrderPayment,
} from '../controllers/orderController.js'
import { protect } from '../middleware/auth.js'
import { staffOnly, requirePermission, requireOTPVerification } from '../middleware/adminAuth.js'

const router = express.Router()

// User routes (protected)
router.get('/my-orders', protect, getMyOrders)
router.get('/:id', protect, getOrderById)
router.post('/', protect, createOrder)
router.put('/:id/cancel', protect, cancelOrder)
router.delete('/:id', protect, deleteOrder)
router.put('/:id/confirm-payment', protect, confirmOrderPayment)

// Admin routes
router.get('/admin/all', protect, staffOnly, requirePermission('orders'), getAllOrders)
router.put('/:id', protect, staffOnly, requirePermission('orders'), requireOTPVerification, updateOrder)

export default router
