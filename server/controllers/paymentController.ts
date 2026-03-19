import { Request, Response, NextFunction } from 'express'
import Order from '../models/Order.js'
import momoService from '../services/momoService.js'
import inventoryService from '../services/inventoryService.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

/**
 * POST /api/payment/momo/init
 * Initialize Momo payment for an order
 */
export const initMomoPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body
  const userId = (req as any).user._id

  // Find and verify order
  const order = await Order.findById(orderId)
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  if (order.user.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' })
  }

  if (order.paymentMethod !== 'Momo') {
    return res.status(400).json({ success: false, message: 'Order payment method is not Momo' })
  }

  try {
    // If request already created, return existing payment info
    if (order.momoRequestId) {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173'
      return res.status(200).json({
        success: true,
        data: {
          payUrl: `https://test-payment.momo.vn/v2/gateway/api/pay?requestId=${order.momoRequestId}`,
          deeplink: `momo://app/pay?requestId=${order.momoRequestId}`,
          applink: `momo://app/pay?requestId=${order.momoRequestId}`,
          qrCodeUrl: `https://api.momo.vn/api/v1/qr-code?requestId=${order.momoRequestId}`,
          requestId: order.momoRequestId,
        },
      })
    }

    // Create Momo payment request
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const momoResponse = await momoService.createPaymentUrl({
      orderId: order._id.toString(),
      amount: Math.round(order.finalPrice),
      orderInfo: `WebBanGame - Đơn hàng ${order.orderCode}`,
      redirectUrl: `${baseUrl}/order-confirm?orderId=${order._id}`,
      ipnUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payment/momo/callback`,
    })

    // Check Momo response
    if (momoResponse.resultCode === 0) {
      // Success - save requestId for verification
      order.momoRequestId = momoResponse.requestId
      await order.save()

      res.status(200).json({
        success: true,
        data: {
          payUrl: momoResponse.payUrl,
          deeplink: momoResponse.deeplink,
          applink: momoResponse.applink,
          qrCodeUrl: momoResponse.qrCodeUrl,
          requestId: momoResponse.requestId,
        },
      })
    } else {
      res.status(400).json({
        success: false,
        message: `Momo error: ${momoResponse.message}`,
        resultCode: momoResponse.resultCode,
      })
    }
  } catch (err: any) {
    console.error('❌ Momo init error:', err)
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to initialize Momo payment',
    })
  }
})

/**
 * POST /api/payment/momo/callback
 * Momo sends IPN callback after payment
 */
export const momoCallback = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, resultCode, transId, requestId } = req.body

  console.log('📩 Momo Callback:', { orderId, resultCode, transId, requestId })

  // Find order
  const order = await Order.findById(orderId)
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  // Verify signature (optional but recommended)
  // const isValid = momoService.verifySignature(req.body, req.body.signature)
  // if (!isValid) {
  //   return res.status(400).json({ success: false, message: 'Invalid signature' })
  // }

  // resultCode 0 = success, anything else = failed
  if (resultCode === 0) {
    // Payment successful
    if (order.paymentStatus === 'paid') {
      // Already processed
      return res.status(200).json({ success: true, message: 'Already processed' })
    }

    // Confirm order stock (move reserved → sold)
    try {
      await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
    } catch (err: any) {
      console.error('⚠️ Stock confirm failed:', err.message)
    }

    // Mark order as paid
    order.paymentStatus = 'paid'
    order.momoTransactionId = transId
    await order.save()

    return res.status(200).json({ success: true, message: 'Payment confirmed' })
  } else {
    // Payment failed
    // Release hold if any
    if (order.reservedAt && order.orderStatus === 'pending' && order.paymentStatus === 'unpaid') {
      try {
        await inventoryService.releaseStock(order.orderItems as any, order._id.toString())
        order.orderStatus = 'failed'
        await order.save()
      } catch (err: any) {
        console.error('⚠️ Stock release failed:', err.message)
      }
    }

    return res.status(400).json({ success: false, message: `Payment failed: ${resultCode}` })
  }
})

/**
 * GET /api/payment/momo/status/:orderId
 * Polling endpoint to check payment status
 * Auto-queries Momo if payment not yet confirmed
 */
export const getMomoPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params
  const userId = (req as any).user._id

  const order = await Order.findById(orderId)
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  if (order.user.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  // If already paid, return immediately
  if (order.paymentStatus === 'paid') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    return res.status(200).json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        momoTransactionId: order.momoTransactionId,
      },
    })
  }

  // If Momo payment and not paid yet, query Momo API to check status
  if (order.paymentMethod === 'Momo' && order.momoRequestId && order.paymentStatus === 'unpaid') {
    try {
      const momoStatus = await momoService.queryPaymentStatus(
        order.momoRequestId,
        order._id.toString(),
        order.finalPrice
      )

      // resultCode 0 = payment successful
      if (momoStatus.resultCode === 0) {
        console.log('✅ MOMO PAYMENT DETECTED VIA QUERY - Updating order to paid')
        
        // Confirm order stock (move reserved → sold)
        try {
          await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
        } catch (err: any) {
          console.error('⚠️ Stock confirm failed:', err.message)
        }

        // Mark order as paid
        order.paymentStatus = 'paid'
        order.momoTransactionId = momoStatus.transId || `QUERY_${Date.now()}`
        await order.save()

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        res.set('Pragma', 'no-cache')
        res.set('Expires', '0')
        return res.status(200).json({
          success: true,
          data: {
            paymentStatus: 'paid',
            orderStatus: order.orderStatus,
            momoTransactionId: order.momoTransactionId,
          },
        })
      }
    } catch (err: any) {
      console.error('⚠️ Momo query error:', err.message)
      // Silent fail - return current status
    }
  }

  // Return current status
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  res.status(200).json({
    success: true,
    data: {
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      momoTransactionId: order.momoTransactionId,
    },
  })
})

/**
 * POST /api/payment/momo/test-callback
 * Test endpoint to simulate Momo callback for development
 * Call this manually after paying via Momo app
 */
export const testMomoCallback = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body
  const userId = (req as any).user._id

  // Find order
  const order = await Order.findById(orderId)
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  if (order.user.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  // Check if already paid
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' })
  }

  try {
    // Confirm order stock (move reserved → sold)
    await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())

    // Mark order as paid
    order.paymentStatus = 'paid'
    order.momoTransactionId = `TEST_${Date.now()}`
    await order.save()

    res.status(200).json({ success: true, message: 'Test payment confirmed' })
  } catch (err: any) {
    console.error('❌ Test callback error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})
