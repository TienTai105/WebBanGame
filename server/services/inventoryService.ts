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
    const inventory = await Inventory.findOne({ productId, variantSku: variantSku || null })

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
      const inventory = await Inventory.findOneAndUpdate(
        { productId, variantSku, available: { $gte: item.quantity } },
        {
          $inc: { available: -item.quantity, reserved: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        // Get current stock to form helpful error message
        const current = await Inventory.findOne({ productId, variantSku })
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

      const inventory = await Inventory.findOneAndUpdate(
        { productId, variantSku, reserved: { $gte: item.quantity } },
        {
          $inc: { reserved: -item.quantity, available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true }
      )

      if (!inventory) {
        console.error(`⚠️ Could not release stock for ${variantSku || productId}, order ${orderId}`)
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
   * Confirm order - move reserved → sold (called after payment confirmed)
   */
  async confirmOrderStock(items: OrderItem[], orderId: string): Promise<void> {
    for (const item of items) {
      const productId = item.product.toString()
      const variantSku = item.variantSku || null

      const inventory = await Inventory.findOneAndUpdate(
        { productId, variantSku, reserved: { $gte: item.quantity } },
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
