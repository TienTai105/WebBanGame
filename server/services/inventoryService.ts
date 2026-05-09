import mongoose from 'mongoose'
import Inventory from '../models/Inventory.js'
import StockMovement from '../models/StockMovement.js'

interface OrderItem {
  product: mongoose.Types.ObjectId | string
  variantSku?: string | null
  quantity: number
}

interface StockCheckResult {
  available: number
  reserved: number
  canBuy: boolean
  message?: string
}

class InventoryService {

  /**
   * Check if enough stock is available (non-blocking read)
   */
  async checkStock(
    productId: string,
    variantSku: string | null | undefined,
    quantity: number
  ): Promise<StockCheckResult> {
    // For base product (no variant), query with variantSku field as null or missing
    const query = variantSku ? 
      { productId, variantSku } : 
      { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

    const inventory = await Inventory.findOne(query)

    if (!inventory) {
      return { available: 0, reserved: 0, canBuy: false, message: 'Inventory not found' }
    }

    return {
      available: inventory.available,
      reserved: inventory.reserved,
      canBuy: inventory.available >= quantity,
    }
  }

  /**
   * Reserve stock atomically for all order items.
   * Uses MongoDB atomic findOneAndUpdate to prevent race conditions / overselling.
   * If any item fails, all previously reserved items are rolled back.
   */
  async reserveStock(items: OrderItem[], orderId: string): Promise<void> {
    const reserved: { productId: string; variantSku: string | null; quantity: number; inventoryId: mongoose.Types.ObjectId }[] = []

    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      // Atomic: only update if available >= quantity (prevents oversell)
      const query = variantSku ? 
        { productId, variantSku } : 
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }
      
      const inventory = await Inventory.findOneAndUpdate(
        { ...query, available: { $gte: item.quantity } },
        {
          $inc: { available: -item.quantity, reserved: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        // Get current stock to form helpful error message
        const current = await Inventory.findOne(query)
        const availableQty = current ? current.available : 0

        // Rollback already-reserved items
        await this.releaseStock(
          reserved.map(r => ({ product: r.productId, variantSku: r.variantSku || undefined, quantity: r.quantity })),
          orderId
        )

        throw new Error(
          `Không đủ hàng cho sản phẩm ${variantSku || productId}. Còn lại: ${availableQty}, yêu cầu: ${item.quantity}`
        )
      }

      reserved.push({
        productId,
        variantSku,
        quantity: item.quantity,
        inventoryId: inventory._id as mongoose.Types.ObjectId,
      })

      // Log stock movement
      await StockMovement.create({
        inventoryId: inventory._id,
        productId: new mongoose.Types.ObjectId(productId),
        variantSku,
        type: 'RESERVED',
        quantity: item.quantity,
        reason: 'Đặt hàng - giữ tồn kho',
        reference: { type: 'Order', id: orderId },
        notes: `Reserved for order: ${orderId}`,
      })
    }
  }

  /**
   * Release reserved stock back to available (payment failed / order cancelled)
   * Uses optimistic locking to prevent race conditions with confirm operations
   */
  async releaseStock(
    items: OrderItem[],
    orderId: string,
    options?: { reason?: string; notes?: string; referenceType?: string }
  ): Promise<void> {
    // ✅ Check if stock was already released to prevent double-release
    const Order = (await import('../models/Order.js')).default
    let orderLookupId: string | null = orderId

    if (orderLookupId.startsWith('order:')) {
      orderLookupId = orderLookupId.replace(/^order:/, '')
    } else if (orderLookupId.startsWith('hold:')) {
      orderLookupId = null
    }

    let order = null
    if (orderLookupId && mongoose.Types.ObjectId.isValid(orderLookupId)) {
      order = await Order.findById(orderLookupId)
    }

    if (order?.stockReleased) {
      console.log(`⚠️ Stock already released for order ${orderLookupId || orderId} at ${order.stockReleasedAt}`)
      return
    }

    let releaseCount = 0

    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      const query = variantSku ?
        { productId, variantSku } :
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

      // Optimistic locking: get current state first
      const currentInventory = await Inventory.findOne(query)
      if (!currentInventory || currentInventory.reserved < item.quantity) {
        console.error(`⚠️ Cannot release stock for ${variantSku || productId}, order ${orderId}: insufficient reserved (${currentInventory?.reserved || 0} < ${item.quantity})`)
        continue
      }

      // Atomic update with version check
      const inventory = await Inventory.findOneAndUpdate(
        {
          ...query,
          reserved: { $gte: item.quantity }, // Ensure still has enough reserved
          // Prevent race with confirm: if sold increased recently, stock might have been confirmed
          sold: { $lte: currentInventory.sold } // Sold should not have increased
        },
        {
          $inc: { reserved: -item.quantity, available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        console.error(`⚠️ Race condition detected: Could not release stock for ${variantSku || productId}, order ${orderId} (stock may have been confirmed)`)
        continue
      }

      const reason = options?.reason || 'Huỷ đơn / thanh toán thất bại'
      const notes = options?.notes || `Released for order: ${orderId}`
      const referenceType = options?.referenceType || 'Order'

      await StockMovement.create({
        inventoryId: inventory._id,
        productId: new mongoose.Types.ObjectId(productId),
        variantSku,
        type: 'UNRESERVED',
        quantity: item.quantity,
        reason,
        reference: { type: referenceType, id: orderId },
        notes,
      })

      releaseCount++
    }

    // ✅ Mark stock as released to prevent double-release only if we actually released inventory
    if (releaseCount > 0 && orderLookupId && mongoose.Types.ObjectId.isValid(orderLookupId)) {
      await Order.findByIdAndUpdate(orderLookupId, {
        stockReleased: true,
        stockReleasedAt: new Date()
      })
    } else if (orderLookupId && mongoose.Types.ObjectId.isValid(orderLookupId)) {
      console.warn(`⚠️ releaseStock: no inventory released for order ${orderLookupId}, skipping stockReleased mark`) 
    } else {
      console.warn(`⚠️ releaseStock: cannot mark order as released because orderId is not a valid ObjectId: ${orderId}`)
    }
  }

  /**
   * Release stock when cancelling order - handles both reserved and sold inventory
   * (In case order was confirmed/paid before cancellation)
   */
  async releaseStockOnCancel(
    items: OrderItem[],
    orderId: string,
    isConfirmed: boolean = false,
    paymentMethod: string = 'COD',
    customReason?: string  // ✅ NEW: Allow custom cancel reason
  ): Promise<void> {
    // ✅ Check if stock was already released to prevent double-release
    const Order = (await import('../models/Order.js')).default
    const order = await Order.findById(orderId)
    if (order?.stockReleased) {
      console.log(`⚠️ Stock already released for order ${orderId} at ${order.stockReleasedAt}`)
      return
    }

    let releaseCount = 0

    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null
      const paymentLabel = paymentMethod === 'Momo' ? 'Momo' : paymentMethod === 'COD' ? 'COD' : paymentMethod
      
      // ✅ Use custom reason if provided, otherwise default
      const cancelReason = customReason || (paymentMethod === 'Momo'
        ? 'Cronjob trả hàng - Huỷ đơn hàng Momo chưa thanh toán'
        : 'Cronjob trả hàng - Huỷ đơn hàng (COD)')

      const query = variantSku ? 
        { productId, variantSku } : 
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

      // If order was confirmed/paid (Momo), stock is in SOLD pool - release ONLY from SOLD
      if (isConfirmed) {
        console.log(`💳 [CONFIRMED ${paymentLabel}] Releasing ${item.quantity} from SOLD pool for ${variantSku || productId}`)
        const inventory = await Inventory.findOneAndUpdate(
          { ...query, sold: { $gte: item.quantity } },
          {
            $inc: { sold: -item.quantity, available: item.quantity },
            $set: { lastUpdated: new Date() },
          },
          { new: true }
        )

        if (inventory) {
          console.log(`✅ [CONFIRMED ${paymentLabel}] Released ${item.quantity} from SOLD pool for ${variantSku || productId}`)
          await StockMovement.create({
            inventoryId: inventory._id,
            productId: new mongoose.Types.ObjectId(productId),
            variantSku,
            type: 'REFUNDED',
            quantity: item.quantity,
            reason: `Hoàn lại hàng do huỷ đơn (thanh toán ${paymentLabel})`,
            reference: { type: 'Order', id: orderId },
            notes: `Refunded from sold (confirmed order): ${orderId}`,
          })
          releaseCount++
          continue
        } else {
          console.error(`❌ [CONFIRMED ${paymentLabel}] Cannot find ${item.quantity} in SOLD pool - stock inconsistency!`)
          continue
        }
      }

      // If order is unpaid, stock should be in RESERVED pool only
      const inventory = await Inventory.findOneAndUpdate(
        { ...query, reserved: { $gte: item.quantity } },
        {
          $inc: { reserved: -item.quantity, available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (inventory) {
        console.log(`✅ [UNPAID ${paymentLabel}] Released ${item.quantity} from RESERVED pool for ${variantSku || productId}`)
        await StockMovement.create({
          inventoryId: inventory._id,
          productId: new mongoose.Types.ObjectId(productId),
          variantSku,
          type: 'UNRESERVED',
          quantity: item.quantity,
          reason: cancelReason,
          reference: { type: 'Order', id: orderId },
          notes: `Released from reserved (${paymentLabel} unpaid order): ${orderId}`,
        })
        releaseCount++
        continue
      }

      // ❌ No fallback - if stock not in reserved pool, it's a data inconsistency
      console.error(`❌ [UNPAID ${paymentLabel}] Stock not found in RESERVED pool for ${variantSku || productId} (order ${orderId}). Check inventory integrity!`)
      continue
    }

    // ✅ Mark stock as released to prevent double-release only if we actually released inventory
    if (releaseCount > 0) {
      await Order.findByIdAndUpdate(orderId, {
        stockReleased: true,
        stockReleasedAt: new Date()
      })
    } else {
      console.warn(`⚠️ releaseStockOnCancel: no inventory released for order ${orderId}, skipping stockReleased mark`)
    }
  }

  /**
   * Confirm order - move reserved → sold (called after payment confirmed)
   * Uses optimistic locking to prevent race conditions with release operations
   */
  async confirmOrderStock(items: OrderItem[], orderId: string): Promise<void> {
    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      const query = variantSku ?
        { productId, variantSku } :
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

      // Optimistic locking: get current reserved amount first
      const currentInventory = await Inventory.findOne(query)
      if (!currentInventory || currentInventory.reserved < item.quantity) {
        console.error(`⚠️ Cannot confirm stock for ${variantSku || productId}, order ${orderId}: insufficient reserved (${currentInventory?.reserved || 0} < ${item.quantity})`)
        continue
      }

      // Atomic update with version check
      const inventory = await Inventory.findOneAndUpdate(
        {
          ...query,
          reserved: { $gte: item.quantity }, // Ensure still has enough reserved
          // Prevent race with release: if available increased recently, stock might have been released
          available: { $lte: currentInventory.available } // Available should not have increased
        },
        {
          $inc: { reserved: -item.quantity, sold: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        console.error(`⚠️ Race condition detected: Could not confirm stock for ${variantSku || productId}, order ${orderId} (stock may have been released)`)
        continue
      }

      await StockMovement.create({
        inventoryId: inventory._id,
        productId: new mongoose.Types.ObjectId(productId),
        variantSku,
        type: 'OUT',
        quantity: item.quantity,
        reason: 'Đơn hàng đã thanh toán',
        reference: { type: 'Order', id: orderId },
        notes: `Confirmed sale for order: ${orderId}`,
      })
    }
  }

  /**
   * Get stock levels for all variants of a product
   */
  async getProductStock(productId: string) {
    return Inventory.find({ productId }, { variantSku: 1, available: 1, reserved: 1, sold: 1, damaged: 1 })
  }

  /**
   * Release expired reservations (for cron job)
   * PRIORITY: If stockConfirmedAt exists, payment already succeeded, so DON'T release
   */
  async releaseExpiredReservations(batchSize: number = 50): Promise<number> {
    const Order = (await import('../models/Order.js')).default
    const now = new Date()
    const momoInProgressGrace = new Date(now.getTime() - 15 * 60 * 1000)

    // Only expire unpaid online-payment orders still in pending status
    // COD orders have no expiry (reservationExpiresAt = null)
    // For Momo orders with a payment request already started, keep the hold for a short grace period
    // CRITICAL: Exclude orders where stockConfirmedAt is set (payment may be confirming)
    const expired = await Order.find({
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      reservationExpiresAt: { $lt: now },
      stockConfirmedAt: null,  // ← Do NOT release if stock was already confirmed
      $or: [
        { momoRequestId: null },
        { momoRequestId: { $exists: false } },
        { paymentStartedAt: { $lt: momoInProgressGrace } },
      ],
    })
      .sort({ reservationExpiresAt: 1 })
      .limit(batchSize)

    let count = 0
    for (const order of expired) {
      try {
        await this.releaseStock(order.orderItems as any, order._id.toString())
        const releaseReason = order.paymentMethod === 'Momo'
          ? 'Cronjob trả hàng - Hủy đơn Momo chưa thanh toán / quá hạn thanh toán'
          : 'Cronjob trả hàng - Hủy đơn thanh toán thất bại'
        await this.releaseStock(order.orderItems as any, order._id.toString(), {
          reason: releaseReason,
          notes: `Released expired reservation for order ${order.orderCode} (${order.paymentMethod})`,
        })
        await Order.findByIdAndUpdate(order._id, { orderStatus: 'failed' })
        count++
        console.log(`⏰ Released expired reservation: ${order.orderCode}`)
        console.log(`⏰ Released expired reservation: ${order.orderCode} (${order._id}, ${order.paymentMethod})`)
      } catch (err) {
        console.error(`❌ Error releasing order ${order.orderCode}:`, err)
        console.error(`❌ Error releasing order ${order.orderCode} (${order._id}):`, err)
      }
    }
  return count
}
  }

export default new InventoryService()
