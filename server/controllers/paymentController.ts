import { Request, Response, NextFunction } from 'express'
import Order from '../models/Order.js'
import momoService from '../services/momoService.js'
import inventoryService from '../services/inventoryService.js'
import { sendOrderConfirmationEmail } from '../services/emailService.js'
import { notifyOrderCompleted } from '../services/notificationService.js'
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
    // Detect retry: If order already has momoRequestId from previous attempt, this is a retry!
    const isRetry = !!order.momoRequestId
    
    if (isRetry) {
      console.log(`🔄 [MOMO RETRY] User calling init again for order ${order.orderCode}, momoRetryCount=${order.momoRetryCount}`)
      order.momoRetryCount = (order.momoRetryCount || 0) + 1
      order.momoRequestId = null  // Reset to create new payment
      await order.save()
    }

    // Only return cached if truly first attempt (no momoRequestId at all)
    if (order.momoRequestId && !isRetry) {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173'
      console.log(`📌 [MOMO CACHED] Returning cached payUrl for order ${order.orderCode}, retryCount=${order.momoRetryCount}`)
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
    // IMPORTANT: Generate UNIQUE momoOrderId EVERY TIME (Momo doesn't allow reuse)
    // Each retry must have a different orderId, so append retry count
    const retryCount = order.momoRetryCount || 0
    const momoOrderId = retryCount === 0 
      ? `${order.orderCode}${Date.now()}`.substring(0, 34)
      : `${order.orderCode}${Date.now()}-${retryCount}`.substring(0, 34)
    
    const momoResponse = await momoService.createPaymentUrl({
      orderId: momoOrderId,
      amount: Math.round(order.finalPrice),
      orderInfo: `Order ${order.orderCode}`,  // Use ASCII only, no Vietnamese characters
      redirectUrl: `${baseUrl}/checkout?orderId=${order._id}&retry=true`,
      ipnUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payment/momo/callback`,
      extraData: order._id.toString(),  // Pass MongoDB ID for callback lookup
    })

    // Check Momo response
    if (momoResponse.resultCode === 0) {
      // Success - save requestId and merchant momoOrderId for later status queries
      order.momoRequestId = momoResponse.requestId
      order.momoOrderId = momoOrderId
      await order.save()

      return res.status(200).json({
        success: true,
        data: {
          payUrl: momoResponse.payUrl,
          deeplink: momoResponse.deeplink,
          applink: momoResponse.applink,
          qrCodeUrl: momoResponse.qrCodeUrl,
          requestId: momoResponse.requestId,
          momoOrderId,
        },
      })
    } else {
      console.error('❌ [MOMO INIT] Momo API error response:', {
        resultCode: momoResponse.resultCode,
        message: momoResponse.message,
        orderId: order.orderCode,
        amount: order.finalPrice,
      })
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
  
  const { orderId, resultCode, transId, requestId, extraData } = req.body

  console.log('� [DEBUG] Extracted data:')
  console.log('  - orderId (Momo custom ID):', orderId)
  console.log('  - extraData (MongoDB ID):', extraData)
  console.log('  - resultCode:', resultCode)
  console.log('  - transId:', transId)

  // Use extraData (MongoDB _id) to find order, NOT orderId (custom Momo orderId)
  const mongoDbOrderId = extraData || orderId
  console.log('🔔 [DEBUG] Using mongoDbOrderId for lookup:', mongoDbOrderId)
  
  const order = await Order.findById(mongoDbOrderId)
  console.log(`🔔 [DEBUG] Order after findById:`, order ? `FOUND - ${order.orderCode}` : 'NOT FOUND')
  
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
        
        // Send Socket.IO notification to user
        try {
          await notifyOrderCompleted(
            populatedOrder.user?._id?.toString() || order.user?.toString(),
            populatedOrder._id.toString()
          )
          console.log(`📢 Socket notification sent for order ${populatedOrder.orderCode}`)
        } catch (notifError: any) {
          console.warn('⚠️ Failed to send socket notification:', notifError.message)
        }
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
    // Payment failed - KEEP order with failed status for retry
    console.log(`❌ MOMO PAYMENT FAILED - Result Code: ${resultCode} - Marking order as failed for retry`)
    
    try {
      // Do not mark as failed if already confirmed via redirect success detection
      if (!order.stockConfirmedAt) {
        order.paymentStatus = 'failed'
        order.momoRequestId = null  // Reset so new QR can be generated
        order.failedAt = new Date() // Track when payment failed for auto-cleanup
        await order.save()
        console.log(`✅ Order marked as failed (kept in DB for retry): ${order._id}`)
      } else {
        console.log(`⏭️ [MOMO CALLBACK] Order ${order._id} already confirmed via redirect success, ignoring failed callback`)
      }
    } catch (err: any) {
      console.error('⚠️ Error handling failed payment:', err.message)
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Giao dịch không thành công. Vui lòng thanh toán lại hoặc chọn phương thức thanh toán khác.',
      redirectUrl: `/orders/${order._id}`
    })
  }
})

export const getMomoPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params
  const userId = (req as any).user._id

  // Check for Momo redirect success params (for test environment fallback)
  const { resultCode, transId } = req.query
  const isMomoRedirectSuccess = resultCode === '0' && transId

  console.log(`🔍 [MOMO STATUS] Checking status for order: ${orderId}`)
  console.log(`🔍 [MOMO STATUS] Momo redirect params: resultCode=${resultCode}, transId=${transId}`)

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

  // SPECIAL CASE: Momo test environment redirect success - auto-confirm payment
  if (isMomoRedirectSuccess && order.paymentMethod === 'Momo' && !order.stockConfirmedAt) {
    console.log(`🎉 [MOMO REDIRECT SUCCESS] Auto-confirming payment for order ${order._id}`)
    
    // Reset failed status if this was a retry after failure
    if (order.paymentStatus === 'failed') {
      console.log(`🔄 [MOMO REDIRECT SUCCESS] Resetting failed status for retry order ${order._id}`)
      order.paymentStatus = 'unpaid'
      order.failedAt = undefined
    }
    
    try {
      // Confirm order stock (move reserved → sold)
      await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
      order.stockConfirmedAt = new Date()

      // Mark order as paid
      order.paymentStatus = 'paid'
      order.momoTransactionId = transId as string
      await order.save()

      console.log(`✅ [MOMO REDIRECT SUCCESS] Order confirmed: ${order.orderCode}`)

      // Send confirmation email
      try {
        const populatedOrder = await Order.findById(order._id)
          .populate('user')
          .populate({
            path: 'orderItems.product',
            select: 'name price',
          })

        if (populatedOrder) {
          const customerEmail = populatedOrder.shippingAddress.email || (populatedOrder.user as any)?.email
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
            console.log(`✅ [MOMO REDIRECT] Confirmation email sent to ${customerEmail}`)
          }
        }
      } catch (emailError: any) {
        console.error('❌ [MOMO REDIRECT] Failed to send confirmation email:', emailError.message)
      }

      // Auto-generate packing slip
      try {
        await packingSlipService.generatePackingSlip(order._id.toString())
        console.log(`✅ [MOMO REDIRECT] Packing slip generated for ${order.orderCode}`)
      } catch (slipError: any) {
        console.error('⚠️ [MOMO REDIRECT] Failed to generate packing slip:', slipError.message)
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
    } catch (confirmError: any) {
      console.error('❌ [MOMO REDIRECT] Failed to confirm payment:', confirmError.message)
      // Continue to status query as fallback
    }
  }

  // If Momo payment and not paid yet, query Momo API to check status
  if (order.paymentMethod === 'Momo' && order.momoRequestId && order.paymentStatus === 'unpaid') {
    try {
      const momoOrderId = order.momoOrderId || order._id.toString()
      console.log(`🔍 [MOMO STATUS] Querying status for order ${order._id}`)
      console.log(`🔍 [MOMO STATUS] Using momoOrderId: ${momoOrderId}`)
      console.log(`🔍 [MOMO STATUS] Using requestId: ${order.momoRequestId}`)

      if (!order.momoOrderId) {
        console.warn(`⚠️ [MOMO STATUS] Missing momoOrderId for order ${order._id}, falling back to order._id for query`)
      }

      const momoStatus = await momoService.queryPaymentStatus(
        order.momoRequestId,
        momoOrderId,
        order.finalPrice
      )

      console.log(`📊 [MOMO STATUS] Query result:`, momoStatus)

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
            
            // Send Socket.IO notification to user
            try {
              await notifyOrderCompleted(
                populatedOrder.user?._id?.toString() || order.user?.toString(),
                populatedOrder._id.toString()
              )
              console.log(`📢 Socket notification sent for order ${populatedOrder.orderCode}`)
            } catch (notifError: any) {
              console.warn('⚠️ Failed to send socket notification:', notifError.message)
            }
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
        // Payment failed - KEEP order with failed status for retry
        console.log(`❌ MOMO PAYMENT FAILED FROM QUERY - Result Code: ${momoStatus.resultCode} - Marking order as failed`)
        
        try {
          // Do not release reserved stock here; keep it until the hold expires or user retries.
          order.paymentStatus = 'failed'
          order.momoRequestId = null
          order.failedAt = new Date() // Track when payment failed for auto-cleanup
          await order.save()
          console.log(`✅ Order marked as failed (kept in DB for retry): ${order._id}`)
        } catch (err: any) {
          console.error('⚠️ Error handling failed payment:', err.message)
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        res.set('Pragma', 'no-cache')
        res.set('Expires', '0')
        return res.status(200).json({
          success: true,
          data: {
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            momoTransactionId: order.momoTransactionId,
            redirectUrl: `/orders/${order._id}`,
          },
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
      const populatedOrder = await Order.findById(order._id)
        .populate('user')
        .populate({
          path: 'orderItems.product',
          select: 'name price',
        })
      
      if (!populatedOrder) {
        console.error('❌ Failed to populate order for email in test callback')
        throw new Error('Failed to populate order')
      }
      
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
        
        // Send Socket.IO notification to user
        try {
          await notifyOrderCompleted(
            userId.toString(),
            order._id.toString()
          )
          console.log(`📢 Socket notification sent for test order ${order.orderCode}`)
        } catch (notifError: any) {
          console.warn('⚠️ Failed to send socket notification in test:', notifError.message)
        }
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

/**
 * POST /api/payment/momo/confirm-paid/:orderId
 * Manually confirm Momo payment (fallback for missing webhook on localhost)
 * Called by frontend after Momo redirects back to checkout page
 */
export const confirmMomoPaymentRetry = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params
  const userId = (req as any).user._id

  console.log(`📍 [MOMO CONFIRM] Confirming payment for order: ${orderId}`)
  console.log(`📍 [DEBUG] User ID: ${userId}`)

  const order = await Order.findById(orderId)
  console.log(`📍 [DEBUG] Order found:`, order ? `YES - ${order.orderCode}` : 'NO')
  
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
  
  if (order.user.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  if (order.paymentStatus === 'paid') {
    return res.status(200).json({ success: true, message: 'Order already paid' })
  }

  try {
    if (order.stockConfirmedAt) {
      return res.status(400).json({ success: false, message: 'Stock already confirmed' })
    }

    // Confirm stock
    await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
    order.stockConfirmedAt = new Date()
    
    // Mark as paid
    order.paymentStatus = 'paid'
    await order.save()

    console.log(`✅ [MOMO CONFIRM] Order paid: ${order.orderCode}`)

    // Send email & packing slip
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('user')
        .populate({
          path: 'orderItems.product',
          select: 'name price',
        })
      
      if (!populatedOrder) {
        console.error('❌ Failed to populate order for email')
        throw new Error('Failed to populate order')
      }
      
      const email = populatedOrder.shippingAddress.email || (populatedOrder.user as any)?.email
      if (email) {
        console.log(`📧 [CONFIRM] Sending order confirmation email to ${email}`)
        await sendOrderConfirmationEmail({
          to: email,
          orderCode: populatedOrder.orderCode,
          orderItems: populatedOrder.orderItems.map((item: any) => ({
            name: item.product?.name,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: populatedOrder.shippingAddress,
          totalPrice: populatedOrder.totalPrice,
          discountAmount: populatedOrder.discountAmount,
          shippingFee: 0,
          finalTotal: populatedOrder.finalPrice,
          paymentMethod: populatedOrder.paymentMethod,
          paymentStatus: 'paid',
        })
        console.log(`✅ [CONFIRM] Email sent successfully to ${email}`)
      }
      await packingSlipService.generatePackingSlip(order._id.toString())
    } catch (e: any) {
      console.error('⚠️ Email/packing slip error:', e.message)
    }

    res.status(200).json({ success: true, message: 'Payment confirmed' })
  } catch (err: any) {
    console.error('❌ Confirm error:', err)
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
