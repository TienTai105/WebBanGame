import { PackingSlip, IPackingSlipItem } from '../models/PackingSlip.js'
import Order from '../models/Order.js'

/**
 * Auto-generate packing slip for order
 * Called after order payment success or COD creation
 */
const generatePackingSlip = async (orderId: string): Promise<any> => {
  try {
    // Check if packing slip already exists
    const existingSlip = await PackingSlip.findOne({ orderId })
    if (existingSlip) {
      console.log(`⚠️ Packing slip already exists for order ${orderId}`)
      return existingSlip
    }

    // Get order details
    const order = await Order.findById(orderId).populate(
      'orderItems.product',
      'name'
    )

    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    // Prepare packing slip items
    const items: IPackingSlipItem[] = order.orderItems.map((item: any) => ({
      productId: item.product._id,
      name: item.name,
      quantity: item.quantity,
      variantSku: item.variantSku || undefined,
      variant: item.variant || undefined,
      itemNotes: undefined,
    }))

    // Create packing slip
    const packingSlip = await PackingSlip.create({
      orderId: order._id,
      orderCode: order.orderCode,
      items,
      shippingAddress: {
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        ward: order.shippingAddress.ward,
        district: order.shippingAddress.district,
      },
      totalPrice: order.totalPrice || 0,
      finalPrice: order.finalPrice || 0,
      status: 'not_printed',
    })

    console.log(`✅ Packing slip generated for order ${order.orderCode}`)
    return packingSlip
  } catch (error: any) {
    console.error(`❌ Failed to generate packing slip for order ${orderId}:`, error.message)
    // Don't throw - packing slip generation should not block order flow
    return null
  }
}

export default {
  generatePackingSlip,
}
