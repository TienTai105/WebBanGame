import cron from 'node-cron'
import inventoryService from '../services/inventoryService.js'
import CheckoutHold from '../models/CheckoutHold.js'
import Order from '../models/Order.js'

/**
 * Start all background cron jobs.
 * Called once during server startup.
 */
export const startCronJobs = (): void => {
  // Every 5 minutes: release expired checkout holds (user left checkout page without ordering)
  cron.schedule('*/5 * * * *', async () => {
    try {
      // Release expired order reservations (online payment orders only)
      const count = await inventoryService.releaseExpiredReservations()
      if (count > 0) {
        console.log(`⏰ [Cron] Released ${count} expired order reservation(s)`)
      }

      // Release expired checkout holds (user left checkout without placing order)
      const expiredHolds = await CheckoutHold.find({
        released: false,
        reservedUntil: { $lt: new Date() },
      })
      for (const hold of expiredHolds) {
        try {
          await inventoryService.releaseStock(
            hold.items.map(i => ({
              product: i.productId,
              variantSku: i.variantSku || undefined,
              quantity: i.quantity,
            })),
            `hold:${hold.holdId}`
          )
          hold.released = true
          await hold.save()
        } catch (e) {
          console.error(`⚠️ [Cron] Failed to release hold ${hold.holdId}:`, e)
        }
      }
      if (expiredHolds.length > 0) {
        console.log(`⏰ [Cron] Released ${expiredHolds.length} expired checkout hold(s)`)
      }
    } catch (err) {
      console.error('❌ [Cron] Cleanup job failed:', err)
    }
  })

  // Every 5 minutes: delete orders where payment failed > 30 minutes ago
  cron.schedule('*/5 * * * *', async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const expiredFailedOrders = await Order.find({
        paymentStatus: 'failed',
        failedAt: { $lt: thirtyMinutesAgo },
      })

      if (expiredFailedOrders.length > 0) {
        for (const order of expiredFailedOrders) {
          try {
            // Release any reserved stock before deleting
            if (order.orderItems && order.orderItems.length > 0) {
              await inventoryService.releaseStock(
                order.orderItems as any,
                order._id.toString()
              ).catch((err: any) => 
                console.log(`⚠️ [Cron] Stock release failed for order ${order._id}:`, err.message)
              )
            }
            // Delete the expired failed order
            await Order.deleteOne({ _id: order._id })
          } catch (err: any) {
            console.error(`⚠️ [Cron] Failed to delete expired failed order ${order._id}:`, err.message)
          }
        }
        console.log(`⏰ [Cron] Deleted ${expiredFailedOrders.length} expired failed order(s)`)
      }
    } catch (err) {
      console.error('❌ [Cron] Failed order cleanup job failed:', err)
    }
  })

  console.log('✓ Cron jobs started (reservation + checkout hold + failed order cleanup every 5 min)')
}
