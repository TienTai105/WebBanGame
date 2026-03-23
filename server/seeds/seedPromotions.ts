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
        code: 'VOLTRIXNEW',
        type: 'fixed',
        value: 50000,
        minOrderValue: 200000,
        usageLimit: 500,
        usedCount: 125,
        usagePerUser: 1,
        badge: 'NEW_MEMBER',
        applicableToNewMembersOnly: true,
        description: 'Giảm trực tiếp đơn đầu',
        conditions: [
          'Áp dụng cho mọi đơn hàng từ 200k trở lên đối với tài khoản đăng ký mới.',
          'Mã này chỉ dành cho thành viên mới (34 ngày đầu)',
          'Có thể kết hợp với các khuyến mãi khác (trừ các mã giảm giá cặp)',
        ],
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'GEARUP10',
        type: 'percentage',
        value: 10,
        maxDiscount: 500000,
        badge: 'HOT',
        description: 'Ưu đãi phụ kiện Gaming',
        conditions: [
          'Giảm thêm 10% khi mua phụ kiện gaming cao cấp',
          'Áp dụng cho các sản phẩm phụ kiện gaming (controller, headset, hub, case, memory, racing accessories)',
        ],  
        usageLimit: 300,
        usedCount: 178,
        usagePerUser: 2,
        startDate,
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),  // 15 days
        isActive: true,
      },
      {
        code: 'WEEKENDPC',
        type: 'fixed',
        value: 100000,
        minOrderValue: 0,
        badge: 'FLASH_SALE',
        description: 'Cuối tuần bùng nổ',
        conditions: [
          'Dành cho đơn hàng PC build sẵn',
          'Áp dụng trong khung giờ vàng 20h-22h Thứ 7 hàng tuần',
          'Phải mua trọn bộ để được áp dụng',
        ],
        usageLimit: 50,
        usedCount: 43,
        usagePerUser: 1,
        startDate,
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),  // 1 day (Flash Sale)
        isActive: true,
      },
      {
        code: 'EWALLET5',
        type: 'percentage',
        value: 5,
        maxDiscount: 50000,
        badge: 'UNLIMITED',
        description: 'Thanh toán qua Ví điện tử',
        conditions: [
          'Giảm 5% tối đa 50k khi chọn thanh toán qua Momo hoặc ZaloPay',
          'Không có giới hạn số lần sử dụng',
          'Áp dụng cho tất cả sản phẩm',
        ],
        usageLimit: 999999,
        usedCount: 12450,
        usagePerUser: 999999,  // Unlimited per user
        startDate,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),  // 1 year
        isActive: true,
      },
      {
        code: 'ELITEGOLD500',
        type: 'fixed',
        value: 500000,
        minOrderValue: 10000000,
        badge: 'PREMIUM',
        applicableToNewMembersOnly: false,  // Cho members lâu năm
        description: 'Mã đặc quyền Elite dành cho thành viên Gold',
        conditions: [
          'Dành riêng cho thành viên Gold (đã mua 10M+ VND)',
          'Giảm trực tiếp 500k cho lần nâng cấp máy tiếp theo',
          'Có thể kết hợp với khuyến mãi khác',
          'Tối đa 1 lần sử dụng/tháng',
        ],
        usageLimit: 30,
        usedCount: 8,
        usagePerUser: 1,
        startDate,
        endDate,
        isActive: true,
      },
      {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        maxDiscount: 500000,
        minOrderValue: 0,
        badge: 'HOT',
        description: 'Giảm 20% tất cả sản phẩm',
        conditions: [
          'Tối đa giảm 500k cho mỗi đơn hàng',
          'Không có giới hạn minimum order',
          'Có thể sử dụng nhiều lần',
        ],
        usageLimit: 500,
        usedCount: 125,
        usagePerUser: 3,
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
        badge: 'FLASH_SALE',
        description: '30% off on all games this weekend',
        conditions: [
          'Áp dụng cho tất cả trò chơi',
          'Minimum order 1M',
          'Tối đa giảm 1M/đơn',
        ],
        usageLimit: 300,
        usedCount: 245,
        usagePerUser: 1,
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
        badge: 'PREMIUM',
        description: 'Save 500k on gaming consoles',
        conditions: [
          'Dành cho máy chơi game',
          'Minimum order 10M',
        ],
        usageLimit: 50,
        usedCount: 12,
        usagePerUser: 1,
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
