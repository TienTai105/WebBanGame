import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Genre from '../models/Genre.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedGenres = async () => {
  try {
    await Genre.deleteMany({})
    console.log('✓ Cleared existing genres')

    const genres = await Genre.create([
      {
        name: 'Action Adventure',
        slug: 'action-adventure',
        description: 'Fast-paced games with combat and quick reflexes',
      },
      {
        name: 'Arcade/ Puzzle',
        slug: 'arcade-puzzle',
        description: 'Arcade and puzzle games with quick reflexes and problem-solving',
      },
      {
        name: 'Family/ Party',
        slug: 'family-party',
        description: 'Games suitable for family and party settings',
      },
      {
        name: 'Fighting',
        slug: 'fighting',
        description: 'Games focused on hand-to-hand combat and martial arts',
      },
      {
        name: 'Game VR',
        slug: 'game-vr',
        description: 'Virtual reality games with immersive experiences',
      },
      {
        name: 'Indie',
        slug: 'indie',
        description: 'Independent games created by small studios or individual developers',
      },
      {
        name: 'Music/ Dance',
        slug: 'music-dance',
        description: 'Music and dance games with rhythm-based gameplay',
      },
      {
        name: 'Platformer',
        slug: 'platformer',
        description: 'Games focused on jumping and climbing between platforms',
      },
      {
        name: 'Racing',
        slug: 'racing',
        description: 'Games focused on racing and driving vehicles',
      },
      {
        name: 'RPG',
        slug: 'rpg',
        description: 'Role-playing games with character progression and story-driven gameplay',
      },
      {
        name: 'Shooter',
        slug: 'shooter',
        description: 'First-person or third-person shooting games',
      },
      {
        name: 'Sport',
        slug: 'sport',
        description: 'Sports simulation and competition games',
      },
      {
        name: 'Strategy/ Sim',
        slug: 'strategy-sim',
        description: 'Games focused on strategic thinking and simulation',
      },
    ])

    console.log(`✓ Genres seeded: ${genres.length} created`)
    return { 
      created: genres.length, 
      message: `Genres seeded: ${genres.length} created`,
      ids: genres
    }
  } catch (error: any) {
    throw new Error(`Genre seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedGenres')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding genres...\n')
      const result = await seedGenres()
      
      console.log(`\n✅ Seed completed: ${result.created} genres created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
