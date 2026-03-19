import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Category from '../models/Category.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedCategories = async () => {
  try {
    // Clear existing categories
    await Category.deleteMany({})
    console.log('✓ Cleared existing categories')

    // Create flat categories (no hierarchy)
    const categories = await Category.create([
      {
        name: 'Game',
        slug: 'game',
        parentId: null,
      },
      {
        name: 'Máy Game',
        slug: 'may-game',
        parentId: null,
      },
      {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        parentId: null,
      },
      {
        name: 'Controller',
        slug: 'controller',
        parentId: null,
      },
      {
        name: 'Headset',
        slug: 'headset',
        parentId: null,
      },
      {
        name: 'Hub - Stand - Dock',
        slug: 'hub-stand-dock',
        parentId: null,
      },
      {
        name: 'Case - Bag',
        slug: 'case-bag',
        parentId: null,
      },
      {
        name: 'Memory',
        slug: 'memory',
        parentId: null,
      },
      {
        name: 'Racing Accessories',
        slug: 'racing-accessories',
        parentId: null,
      },
      {
        name: 'Skin',
        slug: 'skin',
        parentId: null,
      },
    ])

    console.log(`✓ Categories seeded: ${categories.length} created`)

    return { 
      created: categories.length, 
      message: `Categories seeded: ${categories.length} created`,
      ids: categories 
    }
  } catch (error: any) {
    throw new Error(`Category seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedCategories')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding categories...\n')
      const result = await seedCategories()
      
      console.log(`\n✅ Seed completed: ${result.created} categories created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
