import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Platform from '../models/Platform.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedPlatforms = async () => {
  try {
    await Platform.deleteMany({})
    console.log('✓ Cleared existing platforms')

    const platforms = await Platform.create([
      {
        name: 'PlayStation 5',
        slug: 'ps5',
        description: 'Sony PlayStation 5 gaming console',
        logo: '/images/logo_ps5.png',
      },
      {
        name: 'PlayStation 4',
        slug: 'ps4',
        description: 'Sony PlayStation 4 gaming console',
        logo: '/images/logo_ps4.png',
      },
      {
        name: 'Xbox',
        slug: 'xbox',
        description: 'Microsoft Xbox Series X gaming console',
        logo: '/images/logo_xbox.png',
      },
      {
        name: 'Handheld PC',
        slug: 'handheld-pc',
        description: 'Handheld gaming devices',
        logo: '/images/logo_handheld.png',
      },
      {
        name: 'Nintendo Switch',
        slug: 'nintendo-switch',
        description: 'Nintendo Switch gaming console',
        logo: '/images/logo_nintendo.png',
      },
      {
        name: 'Meta Quest',
        slug: 'meta-quest',
        description: 'Meta Quest virtual reality headset',
        logo: '/images/logo_metaquest.png',
      },
      {
        name: 'Retro',
        slug: 'retro',
        description: 'Retro gaming consoles',
        logo: '/images/logo_retro.png',
      },
    ])

    console.log(`✓ Platforms seeded: ${platforms.length} created`)
    return { 
      created: platforms.length, 
      message: `Platforms seeded: ${platforms.length} created`,
      ids: platforms
    }
  } catch (error: any) {
    throw new Error(`Platform seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedPlatforms')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding platforms...\n')
      const result = await seedPlatforms()
      
      console.log(`\n✅ Seed completed: ${result.created} platforms created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
