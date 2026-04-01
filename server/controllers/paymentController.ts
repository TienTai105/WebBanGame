import { Request, Response, NextFunction } from 'express'
import Order from '../models/Order.js'
import momoService from '../services/momoService.js'
import inventoryService from '../services/inventoryService.js'
import { sendOrderConfirmationEmail } from '../services/emailService.js'
import packingSlipService from '../services/packingSlipService.js'

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

      return res.status(200).json({
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
      return res.status(400).json({
        success: false,
        message: `Momo error: ${momoResponse.message}`,
        resultCode: momoResponse.resultCode,
      })
    }
  } catch (err: any) {
    console.error('❌ Momo init error:', err)
    return res.status(500).json({
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
  console.log('🔔 [MOMO CALLBACK] RECEIVED REQUEST - Body:', JSON.stringify(req.body, null, 2))
  
  const { orderId, resultCode, transId, requestId } = req.body

  console.log('📩 [MOMO CALLBACK] Extracted data:', { orderId, resultCode, transId, requestId })

  // Find order
  const order = await Order.findById(orderId)
  console.log(`📩 [MOMO CALLBACK] Order found: ${order ? 'YES - ' + order.orderCode : 'NO'}`)
  
  if (!order) {
    console.error('❌ [MOMO CALLBACK] Order not found for ID:', orderId)
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

    // Confirm order stock (move reserved → sold) - ONLY if not already confirmed
    if (!order.stockConfirmedAt) {
      try {
        await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
        order.stockConfirmedAt = new Date()
      } catch (err: any) {
        console.error('⚠️ Stock confirm failed:', err.message)
      }
    } else {
      console.log(`⏭️ [MOMO] Order ${order.orderCode} stock already confirmed at ${order.stockConfirmedAt}`)
    }

    // Mark order as paid
    order.paymentStatus = 'paid'
    order.momoTransactionId = transId
    await order.save()

    // Send order confirmation email after payment success
    console.log(`📧 Momo payment confirmed (resultCode: ${resultCode}) - sending confirmation email for order ${order.orderCode}`)
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('user')
        .populate({
          path: 'orderItems.product',
          select: 'name price',
        })
      
      if (!populatedOrder) {
        console.error('❌ Failed to populate order for email')
        return
      }
      
      const customerEmail = populatedOrder?.shippingAddress.email || (populatedOrder?.user as any)?.email
      console.log(`📧 Momo Email attempt - shippingAddress.email: ${populatedOrder?.shippingAddress.email}, user.email: ${(populatedOrder?.user as any)?.email}, final: ${customerEmail}`)
      
      if (customerEmail) {
        console.log(`📨 Sending Momo order confirmation email to ${customerEmail}`)
        const emailPayload = {
          to: customerEmail,
          orderCode: populatedOrder.orderCode,
          orderItems: populatedOrder.orderItems.map((item: any) => ({
            name: item.product?.name || item.name || 'Unknown Product',
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase || item.price,
            variantSku: item.variantSku,
            variant: item.variant,
            warranty: item.warranty,
          })),
          shippingAddress: {
            name: populatedOrder.shippingAddress.name || '',
            address: populatedOrder.shippingAddress.address || '',
            city: populatedOrder.shippingAddress.city || '',
            phone: populatedOrder.shippingAddress.phone || '',
            district: populatedOrder.shippingAddress.district || '',
            ward: populatedOrder.shippingAddress.ward || '',
          },
          totalPrice: populatedOrder.totalPrice,
          discountAmount: populatedOrder.discountAmount || 0,
          discountCode: populatedOrder.discountCode || undefined,
          shippingFee: populatedOrder.shippingFee || 0,
          finalTotal: populatedOrder.finalPrice,
          paymentMethod: populatedOrder.paymentMethod,
          paymentStatus: 'paid',
        }
        
        await sendOrderConfirmationEmail(emailPayload)
        console.log(`✅ Order confirmation email sent to ${customerEmail}`)
      } else {
        console.warn('⚠️ No customer email found for Momo order - skipping email')
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send confirmation email after Momo payment:', {
        message: emailError?.message,
        stack: emailError?.stack,
        code: emailError?.code,
      })
    }

    // Auto-generate packing slip for paid orders
    try {
      await packingSlipService.generatePackingSlip(order._id.toString())
    } catch (slipError: any) {
      console.error('⚠️ Failed to generate packing slip for Momo order:', slipError.message)
    }

    return res.status(200).json({ success: true, message: 'Payment confirmed' })
  } else {
    // Payment failed - DELETE order since payment not completed
    console.log(`❌ MOMO PAYMENT FAILED - Result Code: ${resultCode} - Deleting order ${order._id}`)
    
    try {
      // Release stock first
      await inventoryService.releaseStock(order.orderItems as any, order._id.toString())
      
      // If order has holdId, mark hold as released so it can be reused
      if (order.holdId) {
        const CheckoutHold = require('../models/CheckoutHold.js').default
        await CheckoutHold.updateOne(
          { holdId: order.holdId },
          { released: false }
        ).catch((err: any) => console.log('⚠️ Hold reset failed:', err.message))
      }
      
      // Delete order from DB
      await Order.deleteOne({ _id: order._id })
      console.log(`✅ Order deleted after failed payment: ${order._id}`)
    } catch (err: any) {
      console.error('⚠️ Error cleaning up failed payment:', err.message)
    }

    // Don't send email on failed payment
    return res.status(400).json({ 
      success: false, 
      message: 'Giao dịch không thành công. Vui lòng thanh toán lại hoặc chọn phương thức thanh toán khác.' 
    })
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
        
        // Confirm order stock (move reserved → sold) - ONLY if not already confirmed
        if (!order.stockConfirmedAt) {
          try {
            await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
            order.stockConfirmedAt = new Date()
          } catch (err: any) {
            console.error('⚠️ Stock confirm failed:', err.message)
          }
        } else {
          console.log(`⏭️ [MOMO QUERY] Order ${order.orderCode} stock already confirmed at ${order.stockConfirmedAt}`)
        }

        // Mark order as paid
        order.paymentStatus = 'paid'
        order.momoTransactionId = momoStatus.transId || `QUERY_${Date.now()}`
        await order.save()

        // Send order confirmation email after payment success
        try {
          const populatedOrder = await Order.findById(order._id)
            .populate('user')
            .populate({
              path: 'orderItems.product',
              select: 'name price',
            })
          
          const customerEmail = populatedOrder?.shippingAddress.email || (populatedOrder?.user as any)?.email
          if (!populatedOrder) {
            console.error('❌ Failed to populate order for email')
            throw new Error('Failed to populate order')
          }
          
          if (customerEmail) {
            const emailPayload = {
              to: customerEmail,
              orderCode: populatedOrder.orderCode,
              orderItems: populatedOrder.orderItems.map((item: any) => ({
                name: item.product?.name || item.name || 'Unknown Product',
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase || item.price,
                variantSku: item.variantSku,
                variant: item.variant,
                warranty: item.warranty,
              })),
              shippingAddress: {
                name: populatedOrder.shippingAddress.name || '',
                address: populatedOrder.shippingAddress.address || '',
                city: populatedOrder.shippingAddress.city || '',
                phone: populatedOrder.shippingAddress.phone || '',
                district: populatedOrder.shippingAddress.district || '',
                ward: populatedOrder.shippingAddress.ward || '',
              },
              totalPrice: populatedOrder.totalPrice,
              discountAmount: populatedOrder.discountAmount || 0,
              discountCode: populatedOrder.discountCode || undefined,
              shippingFee: populatedOrder.shippingFee || 0,
              finalTotal: populatedOrder.finalPrice,
              paymentMethod: populatedOrder.paymentMethod,
              paymentStatus: 'paid',
            }
            
            await sendOrderConfirmationEmail(emailPayload)
            console.log(`✅ Order confirmation email sent to ${customerEmail}`)
          } else {
            console.warn('⚠️ No customer email found when querying Momo status - skipping email')
          }
        } catch (emailError: any) {
          console.error('❌ Failed to send confirmation email via query:', {
            message: emailError?.message,
            stack: emailError?.stack,
            code: emailError?.code,
          })
        }

        // Auto-generate packing slip for paid orders (query mode)
        try {
          await packingSlipService.generatePackingSlip(order._id.toString())
        } catch (slipError: any) {
          console.error('⚠️ Failed to generate packing slip via query:', slipError.message)
        }

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
      } else {
        // Payment failed - DELETE order since payment not completed
        console.log(`❌ MOMO PAYMENT FAILED FROM QUERY - Result Code: ${momoStatus.resultCode} - Deleting order ${order._id}`)
        
        try {
          // Release stock first
          await inventoryService.releaseStock(order.orderItems as any, order._id.toString())
          
          // If order has holdId, mark hold as released so it can be reused
          if (order.holdId) {
            const CheckoutHold = require('../models/CheckoutHold.js').default
            await CheckoutHold.updateOne(
              { holdId: order.holdId },
              { released: false }
            ).catch((err: any) => console.log('⚠️ Hold reset failed:', err.message))
          }
          
          // Delete order from DB
          await Order.deleteOne({ _id: order._id })
          console.log(`✅ Order deleted after failed payment: ${order._id}`)
        } catch (err: any) {
          console.error('⚠️ Error cleaning up failed payment:', err.message)
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        res.set('Pragma', 'no-cache')
        res.set('Expires', '0')
        return res.status(400).json({
          success: false,
          message: 'Giao dịch không thành công. Vui lòng thanh toán lại hoặc chọn phương thức thanh toán khác.',
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

  // Prevent double-confirm: check stockConfirmedAt
  if (order.stockConfirmedAt) {
    return res.status(400).json({ 
      success: false, 
      message: 'Stock already confirmed for this order' 
    })
  }

  try {
    // Confirm order stock (move reserved → sold)
    await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
    order.stockConfirmedAt = new Date()

    // Mark order as paid
    order.paymentStatus = 'paid'
    order.momoTransactionId = `TEST_${Date.now()}`
    await order.save()

    // Send order confirmation email after payment success
    try {
      const populatedOrder = await (order as any).populate('user').populate({
        path: 'orderItems.product',
        select: 'name price',
      })
      
      const customerEmail = populatedOrder.shippingAddress.email || (populatedOrder.user as any)?.email
      if (customerEmail) {
        const emailPayload = {
          to: customerEmail,
          orderCode: populatedOrder.orderCode,
          orderItems: populatedOrder.orderItems.map((item: any) => ({
            name: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            variantSku: item.variantSku,
            variant: item.variant,
          })),
          shippingAddress: {
            name: populatedOrder.shippingAddress.name || '',
            address: populatedOrder.shippingAddress.address || '',
            city: populatedOrder.shippingAddress.city || '',
            phone: populatedOrder.shippingAddress.phone || '',
            district: populatedOrder.shippingAddress.district,
            ward: populatedOrder.shippingAddress.ward,
          },
          totalPrice: populatedOrder.totalPrice,
          discountAmount: populatedOrder.discountAmount || 0,
          shippingFee: 0,
          finalTotal: populatedOrder.finalPrice,
          paymentMethod: populatedOrder.paymentMethod,
          paymentStatus: 'paid',
        }
        
        await sendOrderConfirmationEmail(emailPayload)
      }
    } catch (emailError: any) {
      console.error('⚠️ Failed to send confirmation email in test callback:', emailError.message)
    }

    // Auto-generate packing slip for test payment
    try {
      await packingSlipService.generatePackingSlip(order._id.toString())
    } catch (slipError: any) {
      console.error('⚠️ Failed to generate packing slip for test payment:', slipError.message)
    }

    res.status(200).json({ success: true, message: 'Test payment confirmed' })
  } catch (err: any) {
    console.error('❌ Test callback error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// Test endpoint to send a test email
export const sendTestEmail = asyncHandler(async (req: Request, res: Response) => {
  const { testEmail = '2200010298@nttu.edu.vn' } = req.body
  
  console.log(`📧 [TEST EMAIL] Attempting to send test email to: ${testEmail}`)
  
  try {
    const { sendOrderConfirmationEmail } = await import('../services/emailService.js')
    
    const testPayload = {
      to: testEmail,
      orderCode: 'TEST-' + Date.now(),
      orderItems: [
        {
          name: 'Test Product',
          quantity: 1,
          priceAtPurchase: 100000,
          warranty: '12 tháng',
        }
      ],
      shippingAddress: {
        name: 'Test User',
        address: '123 Main St',
        city: 'Ha Noi',
        phone: '0123456789',
        district: '',
        ward: '',
      },
      totalPrice: 100000,
      discountAmount: 0,
      discountCode: undefined,
      shippingFee: 30000,
      finalTotal: 130000,
      paymentMethod: 'COD',
      paymentStatus: 'unpaid',
    }
    
    console.log(`📧 [TEST EMAIL] Sending test payload...`)
    const result = await sendOrderConfirmationEmail(testPayload)
    
    console.log(`✅ [TEST EMAIL] Sent successfully! Message ID: ${result.messageId}`)
    res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: testEmail,
    })
  } catch (error: any) {
    console.error(`❌ [TEST EMAIL] Failed to send:`, {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error?.message,
    })
  }
})
