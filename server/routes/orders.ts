import express from 'express'
import {
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrder,
  getAllOrders,
  cancelOrder,
  confirmOrderPayment,
} from '../controllers/orderController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// User routes (protected)
router.get('/my-orders', protect, getMyOrders)
router.get('/:id', protect, getOrderById)
router.post('/', protect, createOrder)
router.put('/:id/cancel', protect, cancelOrder)
router.put('/:id/confirm-payment', protect, confirmOrderPayment)

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllOrders)
router.put('/:id', protect, adminOnly, updateOrder)

export default router
