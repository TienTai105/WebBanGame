import mongoose from 'mongoose'
import dotenv from 'dotenv'
import StockMovement from '../models/StockMovement.js'
import Inventory from '../models/Inventory.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedStockMovement = async () => {
  try {
    await StockMovement.deleteMany({})
    console.log('✓ Cleared existing stock movements')

    const inventories = await Inventory.find()
    const orders = await Order.find().limit(5)

    if (inventories.length === 0) {
      throw new Error('No inventory found - run seedInventory first')
    }

    const movements = []

    // Tạo lịch sử cho mỗi inventory
    for (const inventory of inventories) {
      // IN: Nhập từ supplier (3 tháng trước)
      const importDate = new Date()
      importDate.setMonth(importDate.getMonth() - 3)

      movements.push({
        inventoryId: inventory._id,
        productId: inventory.productId,
        type: 'IN',
        quantity: 100,
        reason: 'Supplier import',
        reference: {
          type: 'ImportBill',
          id: new mongoose.Types.ObjectId(),
        },
        notes: 'Batch import from supplier',
        createdAt: importDate,
      })

      // RESERVED: Khách đặt hàng
      if (inventory.reserved > 0) {
        const reservedDate = new Date()
        reservedDate.setDate(reservedDate.getDate() - 5)

        movements.push({
          inventoryId: inventory._id,
          productId: inventory.productId,
          type: 'RESERVED',
          quantity: inventory.reserved,
          reason: 'Customer order reservation',
          reference: {
            type: 'Order',
            id: orders[0]?._id || new mongoose.Types.ObjectId(),
          },
          createdAt: reservedDate,
        })
      }

      // OUT: Bán hàng (đã trừ)
      if (inventory.sold > 0) {
        const soldDate = new Date()
        soldDate.setDate(soldDate.getDate() - 2)

        movements.push({
          inventoryId: inventory._id,
          productId: inventory.productId,
          type: 'OUT',
          quantity: Math.min(inventory.sold, 100),  // chunk large sales
          reason: 'Order shipped',
          reference: {
            type: 'Order',
            id: orders[0]?._id || new mongoose.Types.ObjectId(),
          },
          createdAt: soldDate,
        })

        // Additional chunks if sold count is high
        if (inventory.sold > 100) {
          movements.push({
            inventoryId: inventory._id,
            productId: inventory.productId,
            type: 'OUT',
            quantity: inventory.sold - 100,
            reason: 'Additional orders shipped',
            reference: {
              type: 'Order',
              id: orders[1]?._id || new mongoose.Types.ObjectId(),
            },
            createdAt: new Date(soldDate.getTime() - 86400000),
          })
        }
      }

      // ADJUST: Kiểm kê, hỏng
      if (inventory.damaged > 0) {
        const adjustDate = new Date()
        adjustDate.setDate(adjustDate.getDate() - 10)

        movements.push({
          inventoryId: inventory._id,
          productId: inventory.productId,
          type: 'ADJUST',
          quantity: -inventory.damaged,
          reason: 'Damage during shipping',
          reference: {
            type: 'Adjustment',
            id: new mongoose.Types.ObjectId(),
          },
          notes: 'Items damaged - removed from inventory',
          createdAt: adjustDate,
        })
      }
    }

    // Additional generic movements for demo
    for (const order of orders.slice(0, 3)) {
      const orderDate = new Date(order.createdAt)

      const inventory = inventories[0]
      if (inventory) {
        movements.push({
          inventoryId: inventory._id,
          productId: inventory.productId,
          type: 'UNRESERVED',
          quantity: 1,
          reason: 'Order cancelled - reservation released',
          reference: {
            type: 'Order',
            id: order._id,
          },
          createdAt: new Date(orderDate.getTime() + 3600000),
        })
      }
    }

    const createdMovements = await StockMovement.create(movements)

    console.log(`✓ Stock movements seeded: ${createdMovements.length} created`)
    return {
      created: createdMovements.length,
      message: `Stock movements seeded: ${createdMovements.length} records created`,
    }
  } catch (error: any) {
    throw new Error(`Stock movement seed error: ${error.message}`)
  }
}

// Run independently
const runDirectly = process.argv[1]?.includes('seedStockMovement')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')

      console.log('🌱 Seeding stock movements...\n')
      const result = await seedStockMovement()

      console.log(`\n✅ Seed completed: ${result.created} stock movements created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
