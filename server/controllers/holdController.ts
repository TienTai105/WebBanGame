import { Request, Response, NextFunction } from 'express'
import { nanoid } from 'nanoid'
import CheckoutHold from '../models/CheckoutHold.js'
import inventoryService from '../services/inventoryService.js'

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err))
  }

const HOLD_DURATION_MS = 15 * 60 * 1000 // 15 minutes


export const createHold = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id
  const { items } = req.body // [{ productId, variantSku, quantity }]

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items required' })
  }

  // Release any existing active hold for this user
  const existing = await CheckoutHold.findOne({ userId, released: false })
  if (existing) {
    try {
      await inventoryService.releaseStock(
        existing.items.map(i => ({
          product: i.productId,
          variantSku: i.variantSku || undefined,
          quantity: i.quantity,
        })),
        `hold:${existing.holdId}`
      )
    } catch (e) {
      console.error('⚠️ Failed to release old hold:', e)
    }
    existing.released = true
    await existing.save()
  }

  // Check stock for all items first
  for (const item of items) {
    const check = await inventoryService.checkStock(item.productId, item.variantSku || null, item.quantity)
    if (!check.canBuy) {
      return res.status(409).json({
        success: false,
        message: `Không đủ hàng cho sản phẩm ${item.variantSku || item.productId}. Còn lại: ${check.available}`,
        data: { productId: item.productId, variantSku: item.variantSku, available: check.available },
      })
    }
  }

  const holdId = nanoid(12)
  const reservedUntil = new Date(Date.now() + HOLD_DURATION_MS)

  const holdItems = items.map((i: any) => ({
    productId: i.productId,
    variantSku: i.variantSku || null,
    quantity: i.quantity,
  }))

  // Reserve stock
  try {
    await inventoryService.reserveStock(
      holdItems.map((i: any) => ({ product: i.productId, variantSku: i.variantSku || undefined, quantity: i.quantity })),
      `hold:${holdId}`
    )
  } catch (err: any) {
    return res.status(409).json({ success: false, message: err.message || 'Không thể giữ hàng' })
  }

  // Persist hold record
  await CheckoutHold.create({ holdId, userId, items: holdItems, reservedUntil, released: false })

  res.status(201).json({
    success: true,
    data: { holdId, reservedUntil },
  })
})

/**
 * DELETE /api/checkout/hold/:holdId (with auth)
 * POST /api/checkout/hold/:holdId/release (without auth, from sendBeacon)
 * Release a hold when user navigates away from checkout without placing order.
 */
export const releaseHold = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id  // Optional - may not exist if sendBeacon
  const { holdId } = req.params

  // If userId exists (auth), verify ownership
  // If userId doesn't exist (sendBeacon), just lookup by holdId
  const query = userId ? { holdId, userId, released: false } : { holdId, released: false }

  const hold = await CheckoutHold.findOne(query)
  if (!hold) {
    console.log(`ℹ️ Hold not found or already released - holdId: ${holdId}, userId: ${userId || 'none (sendBeacon)'}`)
    return res.status(200).json({ success: true, message: 'Hold not found or already released' })
  }

  try {
    console.log(`🧹 Releasing hold: ${holdId} (userId: ${userId || 'sendBeacon'})`)
    await inventoryService.releaseStock(
      hold.items.map(i => ({
        product: i.productId,
        variantSku: i.variantSku || undefined,
        quantity: i.quantity,
      })),
      `hold:${holdId}`
    )
  } catch (e) {
    console.error('⚠️ Failed to release hold:', e)
  }

  hold.released = true
  await hold.save()

  console.log(`✅ Hold released successfully: ${holdId}`)
  res.status(200).json({ success: true, message: 'Hold released' })
})

/**
 * PUT /api/checkout/hold/:holdId/extend
 * Extend hold duration by specified minutes (default 5 minutes)
 * ✅ Only needs holdId (unique identifier), no userId verification needed
 * ✅ Only allows ONE extension per hold
 */
export const extendHold = asyncHandler(async (req: Request, res: Response) => {
  const { holdId } = req.params
  const { extendMinutes = 5 } = req.body

  // ✅ Only lookup by holdId (sufficient unique identifier)
  const hold = await CheckoutHold.findOne({ holdId, released: false })

  if (hold) {
    // ✅ Check if already extended - only allow 1 extension
    if (hold.isExtended) {
      return res.status(400).json({ 
        success: false, 
        message: 'Đã gia hạn 1 lần rồi, không thể gia hạn thêm' 
      })
    }

    // Extend from now if the hold has already expired, otherwise extend from the current reservedUntil
    const now = new Date().getTime()
    const currentExpiry = hold.reservedUntil
    const baseTime = Math.max(now, currentExpiry.getTime())
    const newReservedUntil = new Date(baseTime + extendMinutes * 60 * 1000)
    hold.reservedUntil = newReservedUntil
    hold.isExtended = true  // ✅ Mark as extended
    await hold.save()

    console.log(`⏰ Hold extended (1st & last): ${holdId} by ${extendMinutes} minutes, old expiry: ${currentExpiry.toISOString()}, new expiry: ${newReservedUntil.toISOString()}`)

    return res.status(200).json({
      success: true,
      message: `Hold extended by ${extendMinutes} minutes (this is the only extension allowed)`,
      data: { holdId, reservedUntil: newReservedUntil, isExtended: true }
    })
  }

  // If no active checkout hold exists, try extending the order reservation directly
  const Order = (await import('../models/Order.js')).default
  const order = await Order.findOne({ holdId, orderStatus: 'pending', paymentStatus: 'unpaid' })
  if (!order) {
    return res.status(404).json({ success: false, message: 'Hold not found or already released' })
  }

  if (!order.reservationExpiresAt) {
    return res.status(400).json({ success: false, message: 'No active reservation found for this order' })
  }

  // ✅ Check if order was already extended
  if (order.isExtended) {
    return res.status(400).json({ 
      success: false, 
      message: 'Đã gia hạn 1 lần rồi, không thể gia hạn thêm' 
    })
  }

  const now = new Date().getTime()
  const currentExpiry = order.reservationExpiresAt
  const baseTime = Math.max(now, currentExpiry.getTime())
  const newReservedUntil = new Date(baseTime + extendMinutes * 60 * 1000)
  order.reservationExpiresAt = newReservedUntil
  order.isExtended = true  // ✅ Mark as extended
  await order.save()

  console.log(`⏰ Order reservation extended (1st & last) for hold ${holdId}: old expiry ${currentExpiry.toISOString()}, new expiry ${newReservedUntil.toISOString()}`)

  return res.status(200).json({
    success: true,
    message: `Hold extended by ${extendMinutes} minutes (this is the only extension allowed)`,
    data: { holdId, reservedUntil: newReservedUntil, isExtended: true }
  })
})
