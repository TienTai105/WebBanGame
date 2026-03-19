import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Promotion from '../models/Promotion.js'
import Category from '../models/Category.js'
import Brand from '../models/Brand.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedPromotions = async () => {
  try {
    await Promotion.deleteMany({})
    console.log('✓ Cleared existing promotions')

    // Get references
    const gameCategory = await Category.findOne({ slug: 'game' })
    const machineCategory = await Category.findOne({ slug: 'may-game' })
    const sony = await Brand.findOne({ slug: 'sony' })
    const microsoft = await Brand.findOne({ slug: 'microsoft' })

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const promotions = [
      {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        maxDiscount: 500000,
        minOrderValue: 0,
        usageLimit: 500,
        usedCount: 125,
        usagePerUser: 1,
        description: 'Save 20% on all purchases',
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'NEWCUSTOMER50K',
        type: 'fixed',
        value: 50000,
        minOrderValue: 500000,
        usageLimit: 200,
        usedCount: 68,
        usagePerUser: 1,
        description: 'New customers: save 50k on orders >= 500k',
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'GAMESDAY',
        type: 'percentage',
        value: 30,
        maxDiscount: 1000000,
        minOrderValue: 1000000,
        applicableCategories: gameCategory ? [gameCategory._id] : [],
        usageLimit: 300,
        usedCount: 245,
        usagePerUser: 1,
        description: '30% off on all games this weekend',
        startDate,
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),  // 2 days
        isActive: true,
      },
      {
        code: 'CONSOLE500K',
        type: 'fixed',
        value: 500000,
        minOrderValue: 10000000,
        applicableCategories: machineCategory ? [machineCategory._id] : [],
        usageLimit: 50,
        usedCount: 12,
        usagePerUser: 1,
        description: 'Save 500k on gaming consoles',
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'SONY10',
        type: 'percentage',
        value: 10,
        maxDiscount: 2000000,
        applicableBrands: sony ? [sony._id] : [],
        usageLimit: 150,
        usedCount: 89,
        usagePerUser: 2,
        description: '10% off all Sony products',
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'MICROSOFT15',
        type: 'percentage',
        value: 15,
        maxDiscount: 2500000,
        applicableBrands: microsoft ? [microsoft._id] : [],
        usageLimit: 100,
        usedCount: 56,
        usagePerUser: 1,
        description: '15% discount on Xbox - Limited time',
        startDate,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days
        isActive: true,
      },
      {
        code: 'EXPIRED',
        type: 'percentage',
        value: 50,
        usageLimit: 100,
        usedCount: 100,
        description: 'Expired promotion - should not be usable',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),  // 30 days ago
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),     // 7 days ago
        isActive: false,
      },
      {
        code: 'INACTIVE',
        type: 'percentage',
        value: 25,
        usageLimit: 100,
        usedCount: 0,
        description: 'Manually disabled promotion',
        startDate,
        endDate,
        isActive: false,
      },
      {
        code: 'BULK100',
        type: 'percentage',
        value: 25,
        maxDiscount: 5000000,
        minOrderValue: 5000000,
        usageLimit: 10,
        usedCount: 2,
        usagePerUser: 1,
        description: 'Bulk purchase discount - 25% off on orders >= 5M',
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'VIP20',
        type: 'percentage',
        value: 20,
        maxDiscount: 3000000,
        usageLimit: 50,
        usedCount: 18,
        usagePerUser: 5,  // VIP can use multiple times
        description: 'VIP member exclusive - 20% off',
        startDate,
        endDate,
        isActive: true,
      },
    ]

    const createdPromotions = await Promotion.create(promotions)

    console.log(`✓ Promotions seeded: ${createdPromotions.length} created`)
    return {
      created: createdPromotions.length,
      message: `Promotions seeded: ${createdPromotions.length} vouchers created`,
    }
  } catch (error: any) {
    throw new Error(`Promotion seed error: ${error.message}`)
  }
}

// Run independently
const runDirectly = process.argv[1]?.includes('seedPromotions')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')

      console.log('🌱 Seeding promotions...\n')
      const result = await seedPromotions()

      console.log(`\n✅ Seed completed: ${result.created} promotions created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
