import mongoose from 'mongoose'
import Inventory from '../models/Inventory.js'
import StockMovement from '../models/StockMovement.js'

interface OrderItem {
  product: mongoose.Types.ObjectId | string
  variantSku?: string
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
   */
  async releaseStock(items: OrderItem[], orderId: string): Promise<void> {
    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      const query = variantSku ? 
        { productId, variantSku } : 
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

      const inventory = await Inventory.findOneAndUpdate(
        { ...query, reserved: { $gte: item.quantity } },
        {
          $inc: { reserved: -item.quantity, available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        console.error(`Could not release stock for ${variantSku || productId}, order ${orderId}`)
        continue
      }

      await StockMovement.create({
        inventoryId: inventory._id,
        productId: new mongoose.Types.ObjectId(productId),
        variantSku,
        type: 'UNRESERVED',
        quantity: item.quantity,
        reason: 'Huỷ đơn / thanh toán thất bại',
        reference: { type: 'Order', id: orderId },
        notes: `Released for order: ${orderId}`,
      })
    }
  }

  /**
   * Release stock when cancelling order - handles both reserved and sold inventory
   * (In case order was confirmed/paid before cancellation)
   */
  async releaseStockOnCancel(items: OrderItem[], orderId: string, isConfirmed: boolean = false): Promise<void> {
    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      const query = variantSku ? 
        { productId, variantSku } : 
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

      // If order was confirmed/paid (Momo), stock is in SOLD pool - release ONLY from SOLD
      if (isConfirmed) {
        console.log(`💳 [CONFIRMED MOMO] Releasing ${item.quantity} from SOLD pool for ${variantSku || productId}`)
        const inventory = await Inventory.findOneAndUpdate(
          { ...query, sold: { $gte: item.quantity } },
          {
            $inc: { sold: -item.quantity, available: item.quantity },
            $set: { lastUpdated: new Date() },
          },
          { new: true }
        )

        if (inventory) {
          console.log(`✅ [CONFIRMED] Released ${item.quantity} from SOLD pool for ${variantSku || productId}`)
          await StockMovement.create({
            inventoryId: inventory._id,
            productId: new mongoose.Types.ObjectId(productId),
            variantSku,
            type: 'REFUNDED',
            quantity: item.quantity,
            reason: 'Hoàn lại hàng do huỷ đơn (thanh toán Momo)',
            reference: { type: 'Order', id: orderId },
            notes: `Refunded from sold (confirmed order): ${orderId}`,
          })
          continue
        } else {
          console.error(`❌ [CONFIRMED] Cannot find ${item.quantity} in SOLD pool - stock inconsistency!`)
          continue
        }
      }

      // If order is unpaid (COD), stock is in RESERVED pool - try RESERVED first
      // First try: release from reserved pool (for unpaid orders)
      let inventory = await Inventory.findOneAndUpdate(
        { ...query, reserved: { $gte: item.quantity } },
        {
          $inc: { reserved: -item.quantity, available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (inventory) {
        console.log(`✅ [UNPAID COD] Released ${item.quantity} from RESERVED pool for ${variantSku || productId}`)
        await StockMovement.create({
          inventoryId: inventory._id,
          productId: new mongoose.Types.ObjectId(productId),
          variantSku,
          type: 'UNRESERVED',
          quantity: item.quantity,
          reason: 'Huỷ đơn hàng (COD)',
          reference: { type: 'Order', id: orderId },
          notes: `Released from reserved (unpaid order): ${orderId}`,
        })
        continue
      }

      // Second try: release from sold pool (fallback if stock was accidentally confirmed)
      inventory = await Inventory.findOneAndUpdate(
        { ...query, sold: { $gte: item.quantity } },
        {
          $inc: { sold: -item.quantity, available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (inventory) {
        console.log(`⚠️ [FALLBACK] Released ${item.quantity} from SOLD pool for ${variantSku || productId}`)
        await StockMovement.create({
          inventoryId: inventory._id,
          productId: new mongoose.Types.ObjectId(productId),
          variantSku,
          type: 'REFUNDED',
          quantity: item.quantity,
          reason: 'Hoàn lại hàng - fallback release',
          reference: { type: 'Order', id: orderId },
          notes: `Fallback release from sold: ${orderId}`,
        })
        continue
      }

      // Could not find stock in either pool
      console.error(`⚠️ Stock not found for ${variantSku || productId} (order ${orderId}). Check inventory integrity!`)
    }
  }

  /**
   * Confirm order - move reserved → sold (called after payment confirmed)
   */
  async confirmOrderStock(items: OrderItem[], orderId: string): Promise<void> {
    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      const query = variantSku ? 
        { productId, variantSku } : 
        { productId, $or: [{ variantSku: null }, { variantSku: { $exists: false } }] }

      const inventory = await Inventory.findOneAndUpdate(
        { ...query, reserved: { $gte: item.quantity } },
        {
          $inc: { reserved: -item.quantity, sold: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        console.error(`⚠️ Could not confirm stock for ${variantSku || productId}, order ${orderId}`)
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
   */
  async releaseExpiredReservations(): Promise<number> {
    const Order = (await import('../models/Order.js')).default

    // Only expire unpaid online-payment orders still in pending status
    // COD orders have no expiry (reservationExpiresAt = null)
    const expired = await Order.find({
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: { $ne: 'COD' },
      reservationExpiresAt: { $lt: new Date() },
    })

    let count = 0
    for (const order of expired) {
      try {
        await this.releaseStock(order.orderItems as any, order._id.toString())
        await Order.findByIdAndUpdate(order._id, { orderStatus: 'failed' })
        count++
        console.log(`⏰ Released expired reservation: ${order.orderCode}`)
      } catch (err) {
        console.error(`❌ Error releasing order ${order.orderCode}:`, err)
      }
    }

    return count
  }
}

export default new InventoryService()
