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
