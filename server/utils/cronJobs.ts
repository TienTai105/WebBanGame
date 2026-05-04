import cron from 'node-cron'
import inventoryService from '../services/inventoryService.js'
import CheckoutHold from '../models/CheckoutHold.js'
import Order from '../models/Order.js'

const CRON_SCHEDULE = '*/2 * * * *'
const MAX_HOLD_RELEASE_BATCH = 25
const MAX_FAILED_ORDER_BATCH = 25
const HOLD_GRACE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes grace window after expiry
let isCronJobRunning = false

/**
 * Start all background cron jobs.
 * Called once during server startup.
 */
export const startCronJobs = (): void => {
  cron.schedule(CRON_SCHEDULE, async () => {
    if (isCronJobRunning) {
      console.log('[Cron] Previous cleanup still running, skipping this run')
      return
    }

    isCronJobRunning = true
    const startTime = Date.now()
    console.log('[Cron] Cleanup started')

    try {
      // Release expired order reservations (online payment orders only)
      const orderCount = await inventoryService.releaseExpiredReservations(MAX_FAILED_ORDER_BATCH)
      if (orderCount > 0) {
        console.log(`[Cron] Released ${orderCount} expired order reservation(s)`)
      }

      // Release expired checkout holds (user left checkout without placing order)
      // Only release if expired + grace window has passed
      const now = new Date()
      const graceExpiryTime = new Date(now.getTime() - HOLD_GRACE_WINDOW_MS)
      const expiredHolds = await CheckoutHold.find({
        released: false,
        reservedUntil: { $lt: graceExpiryTime },  // Expired + grace window
      })
        .sort({ reservedUntil: 1 })
        .limit(MAX_HOLD_RELEASE_BATCH)

      for (const hold of expiredHolds) {
        try {
          await inventoryService.releaseStock(
            hold.items.map(i => ({
              product: i.productId,
              variantSku: i.variantSku || undefined,
              quantity: i.quantity,
            })),
            `hold:${hold.holdId}`,
            {
              reason: 'Cronjob trả hàng - Checkout hold hết thời gian giữ hàng',
              notes: `Released expired checkout hold: ${hold.holdId}`,
              referenceType: 'CheckoutHold'
            }
          )
          hold.released = true
          await hold.save()
        } catch (e) {
          console.error(`[Cron] Failed to release hold ${hold.holdId}:`, e)
        }
      }

      if (expiredHolds.length > 0) {
        console.log(`[Cron] Released ${expiredHolds.length} expired checkout hold(s)`)
      }
    } catch (err) {
      console.error('[Cron] Cleanup job failed:', err)
    } finally {
      isCronJobRunning = false
      const durationMs = Date.now() - startTime
      console.log(`[Cron] Cleanup finished in ${durationMs}ms`)
    }
  })

  console.log(`✓ Cron jobs started (reservation + checkout hold + failed order cleanup every 2 min)`)
}
