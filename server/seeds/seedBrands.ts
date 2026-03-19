import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Brand from '../models/Brand.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedBrands = async () => {
  try {
    await Brand.deleteMany({})
    console.log('✓ Cleared existing brands')

    const brands = await Brand.create([
      {
        name: 'Sony',
        slug: 'sony',
        description: 'Sony Interactive Entertainment - PlayStation',
        logo: null,
        website: 'https://www.playstation.com',
      },
      {
        name: 'Microsoft',
        slug: 'microsoft',
        description: 'Microsoft - Xbox',
        logo: null,
        website: 'https://www.xbox.com',
      },
      {
        name: 'Nintendo',
        slug: 'nintendo',
        description: 'Nintendo - Game creator',
        logo: null,
        website: 'https://www.nintendo.com',
      },
      {
        name: 'Razer',
        slug: 'razer',
        description: 'Gaming peripherals and accessories',
        logo: null,
        website: 'https://www.razer.com',
      },
      {
        name: 'SteelSeries',
        slug: 'steelseries',
        description: 'Gaming headsets and peripherals',
        logo: null,
        website: 'https://www.steelseries.com',
      },
      {
        name: 'Corsair',
        slug: 'corsair',
        description: 'Gaming gear and peripherals',
        logo: null,
        website: 'https://www.corsair.com',
      },
    ])

    console.log(`✓ Brands seeded: ${brands.length} created`)
    return { 
      created: brands.length, 
      message: `Brands seeded: ${brands.length} created`,
      ids: brands
    }
  } catch (error: any) {
    throw new Error(`Brand seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedBrands')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding brands...\n')
      const result = await seedBrands()
      
      console.log(`\n✅ Seed completed: ${result.created} brands created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
