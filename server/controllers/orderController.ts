import { Request, Response, NextFunction } from 'express'
import Order from '../models/Order.js'
import CheckoutHold from '../models/CheckoutHold.js'
import inventoryService from '../services/inventoryService.js'
import { sendOrderConfirmationEmail } from '../services/emailService.js'

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
  
  console.log('🔐 ORDER AUTH DEBUG:', {
    orderId: req.params.id,
    orderUserId,
    requestUserId: userId?.toString(),
    userRole,
    match: orderUserId === userId?.toString(),
  })
  
  if (orderUserId !== userId?.toString() && userRole !== 'admin') {
    console.log('❌ AUTH FAILED - User mismatch')
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
  const { orderItems, totalPrice, discountAmount, finalPrice, paymentMethod, shippingAddress, holdId } = req.body
  const userId = (req as any).user._id

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Order items are required',
    })
  }

  const isCOD = paymentMethod === 'COD'

  // STEP 1: Try to use existing checkout hold (stock already reserved)
  // If holdId provided, verify it belongs to this user and inherit the reserved time.
  // Otherwise fall back to fresh stock reservation (COD or hold expired).
  let reservationExpiresAt: Date | null
  let consumedHold = false

  if (holdId && !isCOD) {
    const hold = await CheckoutHold.findOne({ holdId, userId, released: false })
    if (hold && hold.reservedUntil > new Date()) {
      // Inherit the remaining time from the hold window
      reservationExpiresAt = hold.reservedUntil
      // Mark hold as consumed so cron doesn't release it
      hold.released = true
      await hold.save()
      consumedHold = true
    } else {
      // Hold expired or not found — fall through to fresh reservation below
      if (hold) { hold.released = true; await hold.save() }
      reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    }
  } else {
    reservationExpiresAt = isCOD ? null : new Date(Date.now() + 15 * 60 * 1000)
  }

  const reservedAt = new Date()

  // STEP 2: Create order
  let order = await Order.create({
    user: userId,
    orderCode: generateOrderCode(),
    orderItems,
    totalPrice,
    discountAmount: discountAmount || 0,
    finalPrice: finalPrice || totalPrice - (discountAmount || 0),
    paymentMethod,
    paymentStatus: 'unpaid',
    orderStatus: 'pending',
    shippingAddress,
    reservedAt,
    reservationExpiresAt,
    holdId: holdId || undefined,
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
  if (isCOD) {
    try {
      const customerEmail = shippingAddress?.email || (order.user as any)?.email
      if (customerEmail) {
        const emailPayload = {
          to: customerEmail,
          orderCode: order.orderCode,
          orderItems: order.orderItems.map((item: any) => ({
            name: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            variantSku: item.variantSku,
            variant: item.variant,
          })),
          shippingAddress: {
            name: shippingAddress?.name || '',
            address: shippingAddress?.address || '',
            city: shippingAddress?.city || '',
            phone: shippingAddress?.phone || '',
            district: shippingAddress?.district,
            ward: shippingAddress?.ward,
          },
          totalPrice: order.totalPrice,
          discountAmount: order.discountAmount || 0,
          shippingFee: 0,
          finalTotal: order.finalPrice,
          paymentMethod: order.paymentMethod,
          paymentStatus: 'unpaid',
        }
        
        await sendOrderConfirmationEmail(emailPayload)
      }
    } catch (emailError: any) {
      console.error('⚠️ Failed to send order confirmation email:', emailError.message)
    }
  }

  res.status(201).json({
    success: true,
    data: order,
    reservedUntil: isCOD ? null : reservationExpiresAt,
  })
})

// Update order status (admin only)
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderStatus, paymentStatus, trackingNumber } = req.body

  // Find order first so we can check paymentMethod for COD auto-confirm
  const existingOrder = await Order.findById(req.params.id)
  if (!existingOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  // COD: when admin marks order as 'completed', auto-confirm stock (reserved → sold)
  // and mark payment as paid (customer paid cash on delivery)
  if (
    orderStatus === 'completed' &&
    existingOrder.paymentMethod === 'COD' &&
    existingOrder.paymentStatus === 'unpaid'
  ) {
    try {
      await inventoryService.confirmOrderStock(existingOrder.orderItems as any, existingOrder._id.toString())
    } catch (err: any) {
      console.error('⚠️ COD stock confirm failed:', err.message)
    }
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderStatus: orderStatus || undefined,
      // For COD completed orders, auto-set paymentStatus to paid
      paymentStatus: orderStatus === 'completed' && existingOrder.paymentMethod === 'COD'
        ? 'paid'
        : (paymentStatus || undefined),
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
  const order = await Order.findById(req.params.id)

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    })
  }

  if (order.orderStatus !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Can only cancel pending orders',
    })
  }

  const userId = (req as any).user._id
  if (order.user.toString() !== userId && (req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    })
  }

  // Release reserved stock back to available
  if (order.orderStatus === 'pending' && order.paymentStatus === 'unpaid') {
    try {
      await inventoryService.releaseStock(order.orderItems as any, order._id.toString())
    } catch (err) {
      console.error('⚠️ Error releasing stock on cancel:', err)
    }
  }

  order.orderStatus = 'cancelled'
  await order.save()

  res.status(200).json({
    success: true,
    message: 'Order cancelled',
    data: order,
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

  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' })
  }

  // Move reserved → sold in inventory
  try {
    await inventoryService.confirmOrderStock(order.orderItems as any, order._id.toString())
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }

  await Order.findByIdAndUpdate(order._id, {
    paymentStatus: 'paid',
    orderStatus: 'processing',
  })

  res.json({ success: true, message: 'Payment confirmed, stock deducted' })
})
