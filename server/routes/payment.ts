import express from 'express'
import { initMomoPayment, momoCallback, getMomoPaymentStatus, testMomoCallback, sendTestEmail, confirmMomoPaymentRetry } from '../controllers/paymentController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Protected: user initiates Momo payment
router.post('/momo/init', protect, initMomoPayment)

// Protected: polling - check payment status
router.get('/momo/status/:orderId', protect, getMomoPaymentStatus)

// Protected: test endpoint to simulate Momo callback (development only)
router.post('/momo/test-callback', protect, testMomoCallback)

// Protected: confirm Momo payment retry (fallback for missing webhook on localhost)
router.post('/momo/confirm-paid/:orderId', protect, confirmMomoPaymentRetry)

// Public: Momo sends IPN callback (Momo doesn't pass JWT token)
router.post('/momo/callback', momoCallback)

// Protected: test endpoint to send test email
router.post('/test-email', protect, sendTestEmail)

export default router
