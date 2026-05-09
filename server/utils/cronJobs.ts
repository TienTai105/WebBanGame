import cron from 'node-cron'
import inventoryService from '../services/inventoryService.js'
import CheckoutHold from '../models/CheckoutHold.js'
import Order from '../models/Order.js'

const CRON_SCHEDULE = '*/2 * * * *'
const MAX_HOLD_RELEASE_BATCH = 25
const MAX_FAILED_ORDER_BATCH = 25
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
      // Release immediately when hold duration expires
      const now = new Date()
      
      // CASE 1: Find unreleased expired holds (user didn't create order)
      const expiredHolds = await CheckoutHold.find({
        released: false,
        reservedUntil: { $lt: now },  // Expired (no grace window)
      })
        .sort({ reservedUntil: 1 })
        .limit(MAX_HOLD_RELEASE_BATCH)

      for (const hold of expiredHolds) {
        try {
          // Release stock
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

      // CASE 2: Find RELEASED holds that have expired BUT still have pending unpaid orders
      // This handles orders created from holds but payment never completed
      const expiredReleasedHolds = await CheckoutHold.find({
        released: true,
        reservedUntil: { $lt: now },
      })
        .sort({ reservedUntil: 1 })
        .limit(MAX_HOLD_RELEASE_BATCH)

      for (const hold of expiredReleasedHolds) {
        try {
          console.log(`[Cron] CASE 2 - Processing expired released hold: ${hold.holdId}, reservedUntil: ${hold.reservedUntil?.toISOString()}`)
          
          // Check if there's a pending unpaid order using this hold
          // ✅ FIX: Don't filter by reservationExpiresAt in query - order may have fresh 15-min window
          // Check expiry inside the loop instead
          const order = await Order.findOne({ 
            orderStatus: 'pending',
            paymentStatus: 'unpaid',
            holdId: hold.holdId
          })
          
          console.log(`[Cron] CASE 2 - Query result for hold ${hold.holdId}: order found = ${order ? 'YES' : 'NO'}`)
          
          if (order) {
            console.log(`[Cron] CASE 2 - Found order ${order._id} (${order.orderCode}) for hold ${hold.holdId}`)
            console.log(`[Cron]   Hold reservedUntil: ${hold.reservedUntil?.toISOString()}`)
            console.log(`[Cron]   Order reservationExpiresAt: ${order.reservationExpiresAt?.toISOString()}`)
            console.log(`[Cron]   Now: ${now.toISOString()}`)
            
            // ✅ FIX: Only cancel order if BOTH hold AND order have expired
            // Order may have been given a fresh 15-min reservation window, don't cancel early
            const orderHasExpired = !order.reservationExpiresAt || order.reservationExpiresAt < now
            
            console.log(`[Cron]   orderHasExpired: ${orderHasExpired}`)
            
            if (!orderHasExpired) {
              console.log(`[Cron] Hold ${hold.holdId} expired but order ${order._id} still has reservation time until ${order.reservationExpiresAt?.toISOString()}, skipping`)
              continue
            }
            
            console.log(`[Cron] Found expired hold ${hold.holdId} with ALSO-EXPIRED order ${order._id} - cancelling order and releasing stock`)
            
            // ✅ Release stock first
            if (order.orderItems && order.orderItems.length > 0) {
              await inventoryService.releaseStock(
                order.orderItems.map(item => ({
                  product: item.product,
                  variantSku: item.variantSku || undefined,
                  quantity: item.quantity,
                })),
                `order:${order._id}`,
                {
                  reason: 'Cronjob hủy đơn - Hết thời gian thanh toán (released hold)',
                  notes: `Cancelled pending order from expired released hold: ${order.orderCode}`,
                  referenceType: 'Order'
                }
              )
            }
            
            // Then cancel the order
            order.orderStatus = 'cancelled'
            await order.save()
            console.log(`[Cron] Stock released and order cancelled: ${order._id}`)
          }
        } catch (e) {
          console.error(`[Cron] Failed to process released hold ${hold.holdId}:`, e)
        }
      }

      if (expiredReleasedHolds.length > 0) {
        console.log(`[Cron] Processed ${expiredReleasedHolds.length} expired released hold(s)`)
      }

      // ✅ ALSO: Cancel pending orders with expired reservation times
      // These are orders created from a hold, but payment was never completed
      const expiredPendingOrders = await Order.find({
        orderStatus: 'pending',
        paymentStatus: 'unpaid',
        reservationExpiresAt: { $lt: now },  // Reservation expired
      })
        .sort({ reservationExpiresAt: 1 })
        .limit(MAX_FAILED_ORDER_BATCH)

      console.log(`[Cron] CASE 3 - Found ${expiredPendingOrders.length} expired pending orders`)

      for (const order of expiredPendingOrders) {
        try {
          console.log(`[Cron] CASE 3 - Processing order ${order.orderCode} (${order._id})`)
          console.log(`[Cron]   orderStatus: ${order.orderStatus}, paymentStatus: ${order.paymentStatus}`)
          console.log(`[Cron]   reservationExpiresAt: ${order.reservationExpiresAt?.toISOString()}`)
          console.log(`[Cron]   Now: ${now.toISOString()}`)
          
          // Release stock reserved by this order
          if (order.orderItems && order.orderItems.length > 0) {
            console.log(`[Cron]   Releasing ${order.orderItems.length} items...`)
            await inventoryService.releaseStock(
              order.orderItems.map(item => ({
                product: item.product,
                variantSku: item.variantSku || undefined,
                quantity: item.quantity,
              })),
              `order:${order._id}`,
              {
                reason: 'Cronjob hủy đơn - Hết thời gian thanh toán',
                notes: `Cancelled pending unpaid order: ${order.orderCode}`,
                referenceType: 'Order'
              }
            )
            console.log(`[Cron]   Stock released successfully`)
          }

          // Cancel the order
          order.orderStatus = 'cancelled'
          await order.save()
          console.log(`[Cron] Cancelled pending order ${order.orderCode} due to expired reservation`)
        } catch (e) {
          console.error(`[Cron] Failed to cancel order ${order._id}:`, e)
        }
      }

      if (expiredPendingOrders.length > 0) {
        console.log(`[Cron] Cancelled ${expiredPendingOrders.length} expired pending order(s)`)
      }

      // ✅ FIX: Also handle cancelled orders that weren't released yet
      // Orders may have been cancelled by CASE 1/2 but stock not released if no items
      // const cancelledUnreleasedOrders = await Order.find({
      //   orderStatus: 'cancelled',
      //   paymentStatus: { $in: ['unpaid'] },
      //   reservationExpiresAt: { $exists: true, $ne: null, $lt: now },
      //   stockReleased: { $ne: true },  // Stock not released yet
      // })
      //   .sort({ updatedAt: 1 })
      //   .limit(MAX_FAILED_ORDER_BATCH)

      // console.log(`[Cron] CASE 4 - Found ${cancelledUnreleasedOrders.length} cancelled unreleased orders`)

      // for (const order of cancelledUnreleasedOrders) {
      //   try {
      //     console.log(`[Cron] CASE 4 - Processing cancelled order ${order.orderCode} (${order._id})`)
      //     console.log(`[Cron]   Items: ${order.orderItems?.length || 0}`)
          
      //     // Release stock for cancelled orders that haven't released yet
      //     if (order.orderItems && order.orderItems.length > 0) {
      //       console.log(`[Cron]   Releasing ${order.orderItems.length} items...`)
      //       await inventoryService.releaseStock(
      //         order.orderItems.map(item => ({
      //           product: item.product,
      //           variantSku: item.variantSku || undefined,
      //           quantity: item.quantity,
      //         })),
      //         `order:${order._id}`,
      //         {
      //           reason: 'Cronjob trả hàng - Đơn hàng bị hủy do hết thời gian thanh toán',
      //           notes: `Released stock for cancelled order: ${order.orderCode}`,
      //           referenceType: 'Order'
      //         }
      //       )
      //       console.log(`[Cron] Released stock for cancelled order ${order.orderCode}`)
      //     }
      //   } catch (e) {
      //     console.error(`[Cron] Failed to release cancelled order ${order._id}:`, e)
      //   }
      // }

      // if (cancelledUnreleasedOrders.length > 0) {
      //   console.log(`[Cron] Processed ${cancelledUnreleasedOrders.length} cancelled unreleased order(s)`)
      // }
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
