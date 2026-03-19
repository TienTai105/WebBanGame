import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Review from '../models/Review.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedReviews = async () => {
  try {
    await Review.deleteMany({})
    console.log('✓ Cleared existing reviews')

    // Get sample user and product
    const user = await User.findOne({ role: 'user' })
    const product = await Product.findOne()

    if (!user || !product) {
      throw new Error('User or Product not found - run seedUsers and seedProducts first')
    }

    const reviews = await Review.create([
      {
        user: user._id,
        product: product._id,
        rating: 5,
        title: 'Sản phẩm rất tuyệt vời',
        comment: 'Hài lòng với chất lượng và giao hàng nhanh. Sẽ mua lại lần nữa.',
        helpful: { yes: 12, no: 1 },
      },
      {
        user: user._id,
        product: product._id,
        rating: 4,
        title: 'Tốt nhưng giá hơi cao',
        comment: 'Sản phẩm chất lượng tốt nhưng giá so với thị trường hơi cao một chút.',
        helpful: { yes: 5, no: 2 },
      },
    ])

    console.log(`✓ Reviews seeded: ${reviews.length} created`)
    return { 
      created: reviews.length, 
      message: `Reviews seeded: ${reviews.length} created`,
      ids: reviews
    }
  } catch (error: any) {
    throw new Error(`Review seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedReviews')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding reviews...\n')
      const result = await seedReviews()
      
      console.log(`\n✅ Seed completed: ${result.created} reviews created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
