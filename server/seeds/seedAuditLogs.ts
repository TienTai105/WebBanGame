import mongoose from 'mongoose'
import dotenv from 'dotenv'
import AuditLog from '../models/AuditLog.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedAuditLogs = async () => {
  try {
    await AuditLog.deleteMany({})
    console.log('✓ Cleared existing audit logs')

    // Get admin user
    const admin = await User.findOne({ role: 'admin' })
    if (!admin) {
      throw new Error('Admin user not found - run seedUsers first')
    }

    // Get sample products and orders
    const products = await Product.find().limit(5)
    const orders = await Order.find().limit(3)

    const logs = []

    // Product creation logs
    for (const product of products) {
      const createdDate = new Date(product.createdAt)
      logs.push({
        action: 'CREATE',
        entity: 'Product',
        entityId: product._id,
        newValue: {
          name: product.name,
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
        },
        userId: admin._id,
        userEmail: admin.email,
        ipAddress: '192.168.1.100',
        reason: 'New product added to catalog',
        status: 'success',
        createdAt: createdDate,
      })

      // Price update log
      const priceUpdateDate = new Date(createdDate)
      priceUpdateDate.setDate(priceUpdateDate.getDate() + 5)

      logs.push({
        action: 'UPDATE',
        entity: 'Product',
        entityId: product._id,
        changes: {
          minPrice: {
            old: product.minPrice,
            new: Math.round(product.minPrice * 0.9),
          },
          maxPrice: {
            old: product.maxPrice,
            new: Math.round(product.maxPrice * 0.9),
          },
        },
        userId: admin._id,
        userEmail: admin.email,
        ipAddress: '192.168.1.100',
        reason: 'Seasonal discount applied',
        status: 'success',
        createdAt: priceUpdateDate,
      })
    }

    // Stock adjustment logs
    for (const product of products.slice(0, 3)) {
      const adjustDate = new Date()
      adjustDate.setDate(adjustDate.getDate() - 10)

      logs.push({
        action: 'UPDATE',
        entity: 'Inventory',
        entityId: product._id,
        changes: {
          available: {
            old: 50,
            new: 48,
          },
          reserved: {
            old: 10,
            new: 12,
          },
        },
        userId: admin._id,
        userEmail: admin.email,
        ipAddress: '192.168.1.101',
        reason: 'Reservation from new order',
        status: 'success',
        createdAt: adjustDate,
      })

      // Stock deduction log
      const deductDate = new Date(adjustDate)
      deductDate.setDate(deductDate.getDate() + 3)

      logs.push({
        action: 'UPDATE',
        entity: 'Inventory',
        entityId: product._id,
        changes: {
          available: {
            old: 48,
            new: 47,
          },
          reserved: {
            old: 12,
            new: 11,
          },
          sold: {
            old: 150,
            new: 151,
          },
        },
        userId: admin._id,
        userEmail: admin.email,
        ipAddress: '192.168.1.101',
        reason: 'Order confirmed and shipped',
        status: 'success',
        createdAt: deductDate,
      })
    }

    // Order status change logs
    for (const order of orders) {
      const orderDate = new Date(order.createdAt)

      // Order created
      logs.push({
        action: 'CREATE',
        entity: 'Order',
        entityId: order._id,
        newValue: {
          orderCode: order.orderCode,
          totalPrice: order.totalPrice,
          status: order.orderStatus,
        },
        userId: order.user,
        ipAddress: '192.168.1.50',
        status: 'success',
        createdAt: orderDate,
      })

      // Status change: pending -> processing
      const processingDate = new Date(orderDate)
      processingDate.setHours(processingDate.getHours() + 2)

      logs.push({
        action: 'STATUS_CHANGE',
        entity: 'Order',
        entityId: order._id,
        changes: {
          orderStatus: {
            old: 'pending',
            new: 'processing',
          },
        },
        userId: admin._id,
        userEmail: admin.email,
        ipAddress: '192.168.1.100',
        reason: 'Payment confirmed',
        status: 'success',
        createdAt: processingDate,
      })

      // Status change: processing -> shipped
      const shippedDate = new Date(processingDate)
      shippedDate.setHours(shippedDate.getHours() + 6)

      logs.push({
        action: 'STATUS_CHANGE',
        entity: 'Order',
        entityId: order._id,
        changes: {
          orderStatus: {
            old: 'processing',
            new: 'shipped',
          },
        },
        userId: admin._id,
        userEmail: admin.email,
        ipAddress: '192.168.1.100',
        reason: 'Handed to delivery partner',
        status: 'success',
        createdAt: shippedDate,
      })
    }

    // Failed operation log
    const failedDate = new Date()
    failedDate.setDate(failedDate.getDate() - 2)

    logs.push({
      action: 'DELETE',
      entity: 'Product',
      entityId: new mongoose.Types.ObjectId(),
      userId: admin._id,
      userEmail: admin.email,
      ipAddress: '192.168.1.100',
      reason: 'Attempted to delete non-existent product',
      status: 'failed',
      errorMessage: 'Product not found',
      createdAt: failedDate,
    })

    // Promotion creation
    const promoDate = new Date()
    promoDate.setDate(promoDate.getDate() - 1)

    logs.push({
      action: 'CREATE',
      entity: 'Promotion',
      entityId: new mongoose.Types.ObjectId(),
      newValue: {
        code: 'NEWYEAR50',
        type: 'percentage',
        value: 50,
        maxDiscount: 1000000,
      },
      userId: admin._id,
      userEmail: admin.email,
      ipAddress: '192.168.1.100',
      reason: 'New Year promotion campaign',
      status: 'success',
      createdAt: promoDate,
    })

    // Export operation
    const exportDate = new Date()
    exportDate.setDate(exportDate.getDate() - 3)

    logs.push({
      action: 'EXPORT',
      entity: 'Order',
      entityId: new mongoose.Types.ObjectId(),
      userId: admin._id,
      userEmail: admin.email,
      ipAddress: '192.168.1.100',
      reason: 'Monthly order report export',
      status: 'success',
      createdAt: exportDate,
    })

    const createdLogs = await AuditLog.create(logs)

    console.log(`✓ Audit logs seeded: ${createdLogs.length} created`)
    return {
      created: createdLogs.length,
      message: `Audit logs seeded: ${createdLogs.length} records created`,
    }
  } catch (error: any) {
    throw new Error(`Audit log seed error: ${error.message}`)
  }
}

// Run independently
const runDirectly = process.argv[1]?.includes('seedAuditLogs')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')

      console.log('🌱 Seeding audit logs...\n')
      const result = await seedAuditLogs()

      console.log(`\n✅ Seed completed: ${result.created} audit logs created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
