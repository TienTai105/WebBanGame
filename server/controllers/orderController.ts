import { Request, Response, NextFunction } from 'express'
import Order from '../models/Order.js'
import CheckoutHold from '../models/CheckoutHold.js'
import inventoryService from '../services/inventoryService.js'
import { sendOrderConfirmationEmail } from '../services/emailService.js'
import packingSlipService from '../services/packingSlipService.js'
import * as notificationService from '../services/notificationService.js'

// Type for populated user in order
interface IPopulatedUser {
  _id: string
  email: string
  name: string
  role: string
}

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

// Generate order code
const generateOrderCode = () => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// Get user's orders
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status } = req.query
  const userId = (req as any).user._id

  const pageNum = parseInt(page as string) || 1
  const limitNum = parseInt(limit as string) || 10
  const skip = (pageNum - 1) * limitNum

  const filter: any = { user: userId }
  if (status) filter.orderStatus = status

  const orders = await Order.find(filter)
    .populate('user')
    .populate({
      path: 'orderItems.product',
      select: 'name slug images price',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)

  const total = await Order.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pages: Math.ceil(total / limitNum),
    data: orders,
  })
})

// Get order by ID (user can view own, admin can view any)
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user')
    .populate({
      path: 'orderItems.product',
      select: 'name slug images price',
    })

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    })
  }

  // Check authorization
  const userId = (req as any).user._id
  const userRole = (req as any).user.role
  
  // After populate, order.user is a full User object, so get _id from it
  const orderUserId = order.user && typeof order.user === 'object' 
    ? (order.user as any)._id?.toString() 
    : (order.user as any)?.toString()
  
  console.log('ORDER AUTH DEBUG:', {
    orderId: req.params.id,
    orderUserId,
    requestUserId: userId?.toString(),
    userRole,
    match: orderUserId === userId?.toString(),
  })
  
  if (orderUserId !== userId?.toString() && userRole !== 'admin') {
    console.log('AUTH FAILED - User mismatch')
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    })
  }

  // Force no-cache headers to prevent 304 responses
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')

  res.status(200).json({
    success: true,
    data: order,
  })
})

// Create order (with stock reservation)
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { orderItems, totalPrice, discountAmount, discountCode, shippingFee, finalPrice, paymentMethod, shippingAddress, holdId: incomingHoldId } = req.body
    const userId = (req as any).user._id

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required',
      })
    }

    console.log(`📋 [CREATE ORDER] Starting for user ${userId}, method: ${paymentMethod}, items: ${orderItems.length}`)

    const isCOD = paymentMethod === 'COD'

    // STEP 1: Try to use existing checkout hold (stock already reserved)
    // If holdId provided, verify it belongs to this user and inherit the reserved time.
    // Otherwise fall back to fresh stock reservation.
    let reservationExpiresAt: Date | null
    let consumedHold = false
    let effectiveHoldId = incomingHoldId

    // IMPORTANT: Check for ANY active hold for this user, even if holdId wasn't provided
    // This prevents double-reservation when switching payment methods or page reload
    let userHold = null
    if (effectiveHoldId) {
      // If holdId provided, use it
      userHold = await CheckoutHold.findOne({ holdId: effectiveHoldId, userId, released: false })
    } else {
      // If holdId NOT provided, check if ANY active hold exists for this user
      // This handles the case where user switched payment methods or page reloaded
      userHold = await CheckoutHold.findOne({ userId, released: false })
      if (userHold) {
        console.log(`🔍 [AUTO FIND] Found active hold for user: ${userHold.holdId}`)
        effectiveHoldId = userHold.holdId
      }
    }

    // For BOTH Momo and COD: Check if valid checkout hold exists and consume it
    if (effectiveHoldId && userHold) {
      console.log(`🔍 [CHECKOUT HOLD] Checking for hold ${effectiveHoldId}`)
      if (userHold && userHold.reservedUntil > new Date()) {
        // Inherit the remaining time from the hold window
        reservationExpiresAt = userHold.reservedUntil
        // Mark hold as consumed so cron doesn't release it
        userHold.released = true
        await userHold.save()
        consumedHold = true
        console.log(`✅ [CHECKOUT HOLD] Hold consumed for ${isCOD ? 'COD' : 'Momo'}, ${userHold.items.length} items reserved`)
      } else {
        // Hold expired or not found — fall through to fresh reservation below
        if (userHold) { userHold.released = true; await userHold.save() }
        reservationExpiresAt = isCOD ? null : new Date(Date.now() + 15 * 60 * 1000)
        console.log(`⏭️ [CHECKOUT HOLD] Hold not found or expired, will reserve fresh`)
      }
    } else {
      // No hold provided and none found: fresh reservation for Momo, none for COD
      reservationExpiresAt = isCOD ? null : new Date(Date.now() + 15 * 60 * 1000)
    }

    const reservedAt = new Date()

  // STEP 2: Create order
  let order = await Order.create({
    user: userId,
    orderCode: generateOrderCode(),
    orderItems,
    totalPrice,
    discountCode: discountCode || undefined,
    discountAmount: discountAmount || 0,
    shippingFee: shippingFee || 0,
    finalPrice: finalPrice || totalPrice - (discountAmount || 0),
    paymentMethod,
    paymentStatus: 'unpaid',
    orderStatus: 'pending',
    shippingAddress,
    reservedAt,
    reservationExpiresAt,
    // Save holdId for both Momo and COD if checkout hold was consumed
    // Prevents double-reservation and ensures stock protection
    holdId: (consumedHold ? effectiveHoldId : undefined),
  })

  // STEP 3: Reserve stock only if hold was NOT consumed (hold already reserved the stock)
  if (!consumedHold) {
    // Check stock first
    for (const item of orderItems) {
      const check = await inventoryService.checkStock(
        item.product.toString(),
        item.variantSku || null,
        item.quantity
      )
      if (!check.canBuy) {
        await Order.findByIdAndDelete(order._id)
        return res.status(409).json({
          success: false,
          message: `Không đủ hàng: ${item.variantSku || item.product}. Còn lại: ${check.available}, yêu cầu: ${item.quantity}`,
          data: { variantSku: item.variantSku, available: check.available },
        })
      }
    }
    try {
      await inventoryService.reserveStock(orderItems, order._id.toString())
    } catch (stockError: any) {
      await Order.findByIdAndDelete(order._id)
      return res.status(409).json({
        success: false,
        message: stockError.message || 'Không thể đặt hàng do hết hàng',
      })
    }
  }

  order = await order.populate('user')
  order = await order.populate({
    path: 'orderItems.product',
    select: 'name slug images price',
  })

  // Send order confirmation email only for COD (Momo sends after payment confirmed)
  console.log(`📧 Order created - paymentMethod: ${paymentMethod}, isCOD: ${isCOD}, will send email: ${isCOD}`)
  if (isCOD) {
    try {
      const customerEmail = shippingAddress?.email || (order.user as any)?.email
      console.log(`📧 COD Email attempt - shippingAddress.email: ${shippingAddress?.email}, user.email: ${(order.user as any)?.email}, final: ${customerEmail}`)
      
      if (customerEmail) {
        console.log(`📨 Sending COD order confirmation email to ${customerEmail}`)
        const emailPayload = {
          to: customerEmail,
          orderCode: order.orderCode,
          orderItems: order.orderItems.map((item: any) => ({
            name: item.product?.name || item.name || 'Unknown Product',
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase || item.price,
            variantSku: item.variantSku,
            variant: item.variant,
            warranty: item.warranty,
          })),
          shippingAddress: {
            name: shippingAddress?.name || '',
            address: shippingAddress?.address || '',
            city: shippingAddress?.city || '',
            phone: shippingAddress?.phone || '',
            district: shippingAddress?.district || '',
            ward: shippingAddress?.ward || '',
          },
          totalPrice: order.totalPrice,
          discountAmount: order.discountAmount || 0,
          discountCode: order.discountCode || undefined,
          shippingFee: order.shippingFee || 0,
          finalTotal: order.finalPrice,
          paymentMethod: order.paymentMethod,
          paymentStatus: 'unpaid',
        }
        
        await sendOrderConfirmationEmail(emailPayload)
      } else {
        console.warn('⚠️ No customer email found for COD order - skipping email')
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send COD order confirmation email:', {
        message: emailError?.message,
        stack: emailError?.stack,
        code: emailError?.code,
      })
    }
  }

  // Auto-generate packing slip for all orders (COD + Momo)
  try {
    await packingSlipService.generatePackingSlip(order._id.toString())
    console.log(`✅ Packing slip generated for ${order.orderCode}`)
  } catch (slipError: any) {
    console.error('⚠️ Failed to generate packing slip:', slipError.message)
    // Don't fail order creation if packing slip generation fails
  }

  // Send notification to user
  try {
    await notificationService.notifyOrderCreated(userId.toString(), order._id.toString())
  } catch (notifError: any) {
    console.error('⚠️ Failed to send order created notification:', notifError.message)
  }

  res.status(201).json({
    success: true,
    data: order,
    reservedUntil: isCOD ? null : reservationExpiresAt,
  })
  } catch (error: any) {
    console.error('❌ [CREATE ORDER] Fatal error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details || 'No details',
    })
    return res.status(500).json({
      success: false,
      message: `Lỗi tạo đơn hàng: ${error.message || 'Unknown error'}`,
      error: error.message,
    })
  }
})

// ── Status Transition Validation ──────────────────────────
const isValidStatusTransition = (from: string, to: string): boolean => {
  // Cannot change terminal states (completed, cancelled, refunded)
  if (['completed', 'cancelled', 'refunded'].includes(from)) return false
  
  // From pending: can go to processing or cancelled
  if (from === 'pending') return ['processing', 'cancelled'].includes(to)
  
  // From processing: can go to shipped
  if (from === 'processing') return to === 'shipped'
  
  // From shipped: can go to completed
  if (from === 'shipped') return to === 'completed'
  
  // From failed: can retry to pending
  if (from === 'failed') return to === 'pending'
  
  return false
}

const getInvalidTransitionMessage = (from: string, to: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: 'Chờ Xử Lý',
    processing: 'Đang Xử Lý',
    shipped: 'Đang Giao',
    completed: 'Hoàn Thành',
    cancelled: 'Đã Hủy',
    refunded: 'Hoàn Tiền',
    failed: 'Thất Bại',
  }
  
  const fromLabel = statusMap[from] || from
  const toLabel = statusMap[to] || to
  
  if (['completed', 'cancelled', 'refunded'].includes(from)) {
    return `Không thể thay đổi đơn hàng ở trạng thái "${fromLabel}". Đây là trạng thái cuối cùng.`
  }
  
  if (from === 'pending') {
    return `Không thể chuyển từ "Chờ Xử Lý" sang "${toLabel}". Chỉ có thể: Xử lý hoặc Hủy đơn`
  }
  
  if (from === 'processing') {
    return `Không thể chuyển từ "Đang Xử Lý" sang "${toLabel}". Chỉ có thể: Giao hàng`
  }
  
  if (from === 'shipped') {
    return `Không thể chuyển từ "Đang Giao" sang "${toLabel}". Chỉ có thể: Hoàn thành`
  }
  
  return `Không thể chuyển từ "${fromLabel}" sang "${toLabel}".`
}

// Update order status 
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderStatus, paymentStatus, trackingNumber } = req.body

  // Find order first so we can check paymentMethod for COD auto-confirm
  const existingOrder = await Order.findById(req.params.id)
  if (!existingOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  // ✅ VALIDATION: Check if status transition is valid
  if (orderStatus && orderStatus !== existingOrder.orderStatus) {
    if (!isValidStatusTransition(existingOrder.orderStatus, orderStatus)) {
      const message = getInvalidTransitionMessage(existingOrder.orderStatus, orderStatus)
      console.log(`❌ [VALIDATION] Invalid status transition: ${existingOrder.orderStatus} → ${orderStatus}`)
      return res.status(400).json({
        success: false,
        message: message,
        code: 'INVALID_STATUS_TRANSITION',
        currentStatus: existingOrder.orderStatus,
        attemptedStatus: orderStatus,
      })
    }
    console.log(`✅ [VALIDATION] Valid transition: ${existingOrder.orderStatus} → ${orderStatus}`)
  }

  console.log(`📝 [UPDATE ORDER] ${existingOrder.orderCode}:`, {
    currentStatus: existingOrder.orderStatus,
    currentPaymentStatus: existingOrder.paymentStatus,
    paymentMethod: existingOrder.paymentMethod,
    newStatus: orderStatus,
    stockConfirmedAt: existingOrder.stockConfirmedAt,
  })

  // COD: when admin marks order as 'completed' ONLY, auto-confirm stock (reserved → sold)
  // Hold stock until delivery complete, then deduct when marking as delivered/completed
  // Safety: only confirm if paymentStatus is still unpaid AND stockConfirmedAt is not set (prevent double-confirm)
  const isCODCompleting = orderStatus === 'completed' && existingOrder.paymentMethod === 'COD' && existingOrder.paymentStatus === 'unpaid' && !existingOrder.stockConfirmedAt
  
  if (isCODCompleting) {
    try {
      console.log(`💳 [COD CONFIRM] Order ${existingOrder.orderCode}: Confirming ${existingOrder.orderItems.length} items to sold`)
      await inventoryService.confirmOrderStock(existingOrder.orderItems as any, existingOrder._id.toString())
      console.log(`✅ [COD CONFIRM] Stock confirmed successfully`)
      // After successful confirm, we'll set stockConfirmedAt in the update below
    } catch (err: any) {
      console.error('⚠️ [COD CONFIRM] Stock confirm failed:', err.message)
    }
  } else if (orderStatus === 'completed' && existingOrder.paymentMethod === 'COD') {
    if (existingOrder.stockConfirmedAt) {
      console.log(`⏭️ [COD] Order ${existingOrder.orderCode} stock already confirmed at ${existingOrder.stockConfirmedAt}`)
    }
    if (existingOrder.paymentStatus === 'paid') {
      console.log(`ℹ️ [COD] Order ${existingOrder.orderCode} already marked as paid`)
    }
  } else if (!isCODCompleting && orderStatus === 'completed') {
    console.log(`ℹ️ [UPDATE] Order ${existingOrder.orderCode} marked as completed (${existingOrder.paymentMethod} payment)`)
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderStatus: orderStatus || undefined,
      // Auto-set paymentStatus for COD when status changes to completed
      paymentStatus: (
        isCODCompleting ? 'paid' : (paymentStatus || undefined)
      ),
      // Set when stock is actually confirmed
      stockConfirmedAt: isCODCompleting ? new Date() : undefined,
      trackingNumber: trackingNumber || undefined,
    },
    { new: true, runValidators: true }
  ).populate('user').populate({
    path: 'orderItems.product',
    select: 'name slug images price',
  })

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    })
  }

  console.log(`✔️ [UPDATE ORDER] ${order.orderCode} updated:`, {
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
  })

  // Audit log for order status change
  try {
    const AuditLog = (await import('../models/AuditLog.js')).default
    await AuditLog.create({
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: order._id,
      changes: {
        orderStatus: { old: existingOrder.orderStatus, new: order.orderStatus },
        ...(order.paymentStatus !== existingOrder.paymentStatus ? { paymentStatus: { old: existingOrder.paymentStatus, new: order.paymentStatus } } : {}),
      },
      userId: (req as any).user?._id,
      ipAddress: req.ip,
    })
  } catch {}

  // Send email notification if order status changed
  const userEmail = (order.user as unknown as IPopulatedUser)?.email
  if (order.orderStatus !== existingOrder.orderStatus && userEmail) {
    try {
      const { sendOrderStatusUpdateEmail } = await import('../services/emailService.js')
      
      await sendOrderStatusUpdateEmail({
        to: userEmail,
        orderCode: order.orderCode,
        oldStatus: existingOrder.orderStatus,
        newStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        totalPrice: order.totalPrice,
        discountAmount: order.discountAmount,
        shippingFee: order.shippingFee,
        finalPrice: order.finalPrice,
        orderItems: order.orderItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        })),
        shippingAddress: order.shippingAddress,
      })
      console.log(`📧 [EMAIL] Order status update notification sent to ${userEmail}`)
    } catch (emailError: any) {
      console.error(`⚠️ [EMAIL ERROR] Failed to send order status update email:`, {
        orderCode: order.orderCode,
        email: userEmail,
        message: emailError?.message,
        code: emailError?.code,
      })
    }
  }

  // Send notification to user about order status update
  if (order.orderStatus !== existingOrder.orderStatus) {
    try {
      const userId = (order.user as unknown as IPopulatedUser)?._id
      if (userId) {
        await notificationService.notifyOrderUpdated(
          userId,
          order._id.toString(),
          order.orderStatus
        )
        
        // Special notification if order is completed
        if (order.orderStatus === 'completed') {
          await notificationService.notifyOrderCompleted(
            userId,
            order._id.toString()
          )
        }
      }
    } catch (notifError: any) {
      console.error('⚠️ Failed to send order status notification:', notifError.message)
    }
  }

  res.status(200).json({
    success: true,
    data: order,
  })
})

// Get all orders (admin only)
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status } = req.query

  const pageNum = parseInt(page as string) || 1
  const limitNum = parseInt(limit as string) || 20
  const skip = (pageNum - 1) * limitNum

  const filter: any = {}
  if (status) filter.orderStatus = status

  const orders = await Order.find(filter)
    .populate('user')
    .populate({
      path: 'orderItems.product',
      select: 'name slug images price',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)

  const total = await Order.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pages: Math.ceil(total / limitNum),
    data: orders,
  })
})

// Cancel order (user can cancel own pending orders)
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  console.log(`🔍 Cancel order request for: ${req.params.id}`)
  
  const order = await Order.findById(req.params.id)

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    })
  }

  console.log(`📦 Current order status: ${order.orderStatus}, Payment status: ${order.paymentStatus}`)

  if (order.orderStatus !== 'pending' && order.orderStatus !== 'processing') {
    return res.status(400).json({
      success: false,
      message: 'Chỉ có thể hủy đơn hàng chưa được giao hoặc đang xử lý',
    })
  }

  const userId = (req as any).user._id
  if (order.user.toString() !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    })
  }

  // Release reserved or sold stock back to available
  if (order.orderStatus === 'pending' || order.orderStatus === 'processing') {
    try {
      // Check if order is confirmed/paid (Momo) or unpaid (COD)
      const isConfirmed = order.paymentStatus === 'paid' || !!order.stockConfirmedAt
      console.log(`💾 Releasing stock for ${order.orderItems.length} items... (isConfirmed: ${isConfirmed})`)
      await inventoryService.releaseStockOnCancel(order.orderItems as any, order._id.toString(), isConfirmed)
      console.log(`✅ Stock released successfully from ${isConfirmed ? 'SOLD' : 'RESERVED'} pool`)
    } catch (err) {
      console.error('⚠️ Error releasing stock on cancel:', err)
    }
  } else {
    console.log(`⏭️ Skipping stock release - Status: ${order.orderStatus}`)
  }

  order.orderStatus = 'cancelled'
  await order.save()

  // Audit log for order cancellation
  try {
    const AuditLog = (await import('../models/AuditLog.js')).default
    await AuditLog.create({
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: order._id,
      changes: { orderStatus: { old: 'pending', new: 'cancelled' } },
      userId: (req as any).user?._id,
      ipAddress: req.ip,
    })
  } catch {}

  console.log(`✔️ Order cancelled successfully: ${order._id}`)

  res.status(200).json({
    success: true,
    message: 'Order cancelled',
    data: order,
  })
})

// Delete order completely (for failed payments)
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  console.log(`🗑️ Delete order request for: ${req.params.id}`)

  const order = await Order.findById(req.params.id)

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    })
  }

  console.log(`📦 Current order status: ${order.orderStatus}, Payment status: ${order.paymentStatus}`)

  // Only allow deletion for pending/processing orders (same as cancel)
  if (order.orderStatus !== 'pending' && order.orderStatus !== 'processing') {
    return res.status(400).json({
      success: false,
      message: 'Chỉ có thể xóa đơn hàng chưa được giao hoặc đang xử lý',
    })
  }

  const userId = (req as any).user._id
  if (order.user.toString() !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    })
  }

  // Release reserved or sold stock back to available
  if (order.orderStatus === 'pending' || order.orderStatus === 'processing') {
    try {
      // Check if order is confirmed/paid (Momo) or unpaid (COD)
      const isConfirmed = order.paymentStatus === 'paid' || !!order.stockConfirmedAt
      console.log(`💾 Releasing stock for ${order.orderItems.length} items before deletion... (isConfirmed: ${isConfirmed})`)
      await inventoryService.releaseStockOnCancel(order.orderItems as any, order._id.toString(), isConfirmed)
      console.log(`✅ Stock released successfully from ${isConfirmed ? 'SOLD' : 'RESERVED'} pool`)
    } catch (err) {
      console.error('⚠️ Error releasing stock on delete:', err)
    }
  }

  // Delete the order completely
  await Order.findByIdAndDelete(order._id)

  // Audit log for order deletion
  try {
    const AuditLog = (await import('../models/AuditLog.js')).default
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Order',
      entityId: order._id,
      changes: { deleted: true, reason: 'User cancelled failed payment' },
      userId: (req as any).user?._id,
      ipAddress: req.ip,
    })
  } catch {}

  console.log(`✔️ Order deleted successfully: ${order._id}`)

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully',
  })
})

// Confirm order payment - move reserved → sold (called after payment success)
export const confirmOrderPayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  const userId = (req as any).user._id
  if (order.user.toString() !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  // COD orders should NOT use this endpoint - admin updates status instead
  if (order.paymentMethod === 'COD') {
    return res.status(400).json({ 
      success: false, 
      message: 'COD orders: admin updates status to "completed" to deduct stock, no manual payment confirm needed' 
    })
  }

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

  // Only for online payments (Momo, etc)
  if (order.paymentMethod !== 'Momo') {
    return res.status(400).json({ 
      success: false, 
      message: `Payment confirmation not supported for ${order.paymentMethod}` 
    })
  }

  // Move reserved → sold in inventory
  try {
    await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
  } catch (err: any) {
    console.error('⚠️ Stock confirm failed:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }

  await Order.findByIdAndUpdate(order._id, {
    paymentStatus: 'paid',
    orderStatus: order.orderStatus === 'pending' ? 'processing' : order.orderStatus,
    stockConfirmedAt: new Date(),
  })

  res.json({ 
    success: true, 
    message: 'Online payment confirmed, stock deducted'
  })
})
