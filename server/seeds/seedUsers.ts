import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedUsers = async (): Promise<{ created: number; message: string; ids: any[] }> => {
  try {
    await User.deleteMany({})
    console.log('✓ Cleared existing users')

    // Passwords will be hashed by Mongoose pre-save middleware
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@webgame.com',
        password: 'password123',
        phone: '0901234567',
        role: 'admin',
        isActive: true,
      },
      {
        name: 'Nguyễn Văn A',
        email: 'customer@webgame.com',
        password: 'password456',
        phone: '0909876543',
        role: 'customer',
        isActive: true,
        shippingAddresses: [
          {
            name: 'Nhà riêng',
            street: '123 Đường Lê Lợi',
            city: 'Hà Nội',
            district: 'Hoàn Kiếm',
            ward: 'Tràng Tiền',
            zipCode: '100000',
            isDefault: true,
          },
        ],
      },
    ])

    console.log(`✓ Users seeded: ${users.length} created`)
    return { 
      created: users.length, 
      message: `Users seeded: ${users.length} created`,
      ids: users
    }
  } catch (error: any) {
    throw new Error(`User seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedUsers')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding users...\n')
      const result = await seedUsers()
      
      console.log(`\n✅ Seed completed: ${result.created} users created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
