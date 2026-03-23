import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { 
  seedCategories, 
  seedPlatforms, 
  seedGenres, 
  seedBrands,
  seedUsers, 
  seedProducts, 
  seedNews,
  seedOrders,
  seedReviews
} from './seeds/index.js'
import { seedInventory } from './seeds/seedInventory.js'
import { seedStockMovement } from './seeds/seedStockMovement.js'
import { seedPromotions } from './seeds/seedPromotions.js'
import { seedAuditLogs } from './seeds/seedAuditLogs.js'
import connectDB from './config/db.js'

dotenv.config()

const runSeeds = async () => {
  try {
    // Connect to MongoDB
    await connectDB()
    console.log('✓ Connected to MongoDB\n')

    // Run seeds in correct order
    console.log('╔════════════════════════════════════════╗')
    console.log('║        STARTING SEED PROCESS           ║')
    console.log('╚════════════════════════════════════════╝\n')

    // PHASE 1: Base reference data
    console.log('═══ PHASE 1: Reference Data ═══\n')
    
    const categoryResult = await seedCategories()
    console.log(`✓ ${categoryResult.message}\n`)

    const platformResult = await seedPlatforms()
    console.log(`✓ ${platformResult.message}\n`)

    const genreResult = await seedGenres()
    console.log(`✓ ${genreResult.message}\n`)

    const brandResult = await seedBrands()
    console.log(`✓ ${brandResult.message}\n`)

    // PHASE 2: User & Product data
    console.log('\n═══ PHASE 2: User & Product Data ═══\n')
    
    const userResult = await seedUsers()
    console.log(`✓ ${userResult.message}\n`)

    const productResult = await seedProducts()
    console.log(`✓ ${productResult.message}\n`)

    const newsResult = await seedNews()
    console.log(`✓ ${newsResult.message}\n`)

    // PHASE 3: Inventory Management (NEW)
    console.log('\n═══ PHASE 3: Inventory Management ═══\n')
    
    const inventoryResult = await seedInventory()
    console.log(`✓ ${inventoryResult.message}\n`)

    const stockMovementResult = await seedStockMovement()
    console.log(`✓ ${stockMovementResult.message}\n`)

    // PHASE 4: Promotions (NEW)
    console.log('\n═══ PHASE 4: Promotions ═══\n')
    
    const promotionResult = await seedPromotions()
    console.log(`✓ ${promotionResult.message}\n`)

    // PHASE 5: Transaction data
    console.log('\n═══ PHASE 5: Transactions ═══\n')
    
    const orderResult = await seedOrders()
    console.log(`✓ ${orderResult.message}\n`)

    const reviewResult = await seedReviews()
    console.log(`✓ ${reviewResult.message}\n`)

    // PHASE 6: Audit Logs (NEW)
    console.log('\n═══ PHASE 6: Audit Logs ═══\n')
    
    const auditResult = await seedAuditLogs()
    console.log(`✓ ${auditResult.message}\n`)

    console.log('╔════════════════════════════════════════╗')
    console.log('║    🎉 ALL SEEDS COMPLETED! ✅          ║')
    console.log('║                                        ║')
    console.log('║ Ready for development! 🚀              ║')
    console.log('╚════════════════════════════════════════╝')

    process.exit(0)
  } catch (error: any) {
    console.error('\n✗ SEED ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runSeeds()
