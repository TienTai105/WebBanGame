import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import connectDB from '../config/db.js'

dotenv.config()

// Helper to generate order code
const generateOrderCode = () => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export const seedOrders = async () => {
  try {
    await Order.deleteMany({})
    console.log('✓ Cleared existing orders')

    // Get sample users and products with variants
    const users = await User.find({ role: 'user' }).limit(3)
    const products = await Product.find().limit(5)

    if (users.length === 0 || products.length === 0) {
      throw new Error('Users or Products not found - run seedUsers and seedProducts first')
    }

    const orders = []

    // Create 6 sample orders
    for (let i = 0; i < 6; i++) {
      const user = users[i % users.length]
      const product = products[i % products.length]
      
      // Get a variant if product has variants
      const variant = product.variants && product.variants.length > 0 
        ? product.variants[0] 
        : null
      
      const quantity = Math.floor(Math.random() * 3) + 1  // 1-3 items
      const priceAtPurchase = variant?.finalPrice || product.finalPrice || product.price || 500000
      const totalPrice = priceAtPurchase * quantity
      const discountAmount = i % 3 === 0 ? Math.floor(totalPrice * 0.1) : 0  // 10% discount for some
      const finalPrice = totalPrice - discountAmount

      orders.push({
        user: user._id,
        orderCode: generateOrderCode(),
        orderItems: [
          {
            product: product._id,
            variantSku: variant?.sku || `${product.sku}-DEFAULT`,  // ← Thêm variant SKU
            quantity,
            name: product.name,  // ← Snapshot product name
            image: product.images?.[0]?.url || null,  // ← Snapshot product image
            priceAtPurchase,  // ← Đổi từ price → priceAtPurchase
            price: priceAtPurchase,  // ← Keep price for backward compat
            variant: variant ? { sku: variant.sku, name: variant.name } : null,  // ← Snapshot variant
          },
        ],
        totalPrice,
        discountAmount,
        finalPrice,
        paymentMethod: ['COD', 'VNPay', 'Momo'][Math.floor(Math.random() * 3)],
        paymentStatus: i % 2 === 0 ? 'unpaid' : 'paid',  // Alternating paid/unpaid
        orderStatus: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'processing' : 'shipped',
        shippingAddress: {
          name: user.name || `Khách hàng ${i + 1}`,
          address: `${123 + i} Đường Lê Lợi`,
          city: ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'][i % 3],
          phone: `090${Math.random().toString().substring(2, 9)}`,
        },
        // ← Thêm reservation fields
        reservedAt: i % 2 === 0 ? new Date(Date.now() - 3600000) : null,  // 1 hour ago
        reservationExpiresAt: i % 2 === 0 ? new Date(Date.now() + 300000) : null,  // 5 mins from now
      })
    }

    const createdOrders = await Order.create(orders)

    console.log(`✓ Orders seeded: ${createdOrders.length} created`)
    return { 
      created: createdOrders.length, 
      message: `Orders seeded: ${createdOrders.length} created`,
      ids: createdOrders.map(o => o._id)
    }
  } catch (error: any) {
    throw new Error(`Order seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedOrders')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding orders...\n')
      const result = await seedOrders()
      
      console.log(`\n✅ Seed completed: ${result.created} orders created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
