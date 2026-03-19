import cron from 'node-cron'
import inventoryService from '../services/inventoryService.js'
import CheckoutHold from '../models/CheckoutHold.js'

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

  console.log('✓ Cron jobs started (reservation + checkout hold cleanup every 5 min)')
}
