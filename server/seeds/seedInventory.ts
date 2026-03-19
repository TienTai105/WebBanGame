import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Inventory from '../models/Inventory.js'
import Product from '../models/Product.js'
import connectDB from '../config/db.js'

dotenv.config()

export const seedInventory = async () => {
  try {
    await Inventory.deleteMany({})
    console.log('✓ Cleared existing inventory')

    // Get all products
    const products = await Product.find()

    if (products.length === 0) {
      throw new Error('No products found - run seedProducts first')
    }

    // Create inventory for EACH VARIANT of each product
    const inventories = []
    let noVariantCount = 0

    for (const product of products) {
      // CASE 1: Product HAS variants → create inventory per variant
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          const variantStock = typeof variant.stock === 'number'
            ? variant.stock
            : (typeof product.stock === 'number' ? product.stock : 0)

          if (typeof variant.stock !== 'number' && typeof product.stock !== 'number') {
            console.warn(`⚠️  Missing stock for variant "${variant.sku}" of product "${product.name}"; defaulting to 0`)
          }

          inventories.push({
            productId: product._id,
            variantSku: variant.sku,  // Required compound key
            available: variantStock,  // Từ variant.stock, fallback product.stock
            reserved: 0,
            sold: 0,
            damaged: 0,
            lastUpdated: new Date(),
          })
        }
      }
      // CASE 2: Product NO variants → fallback to single inventory entry
      else {
        noVariantCount++
        const fallbackSku = product.sku || `${product.name.toUpperCase().replace(/\s+/g, '-')}-DEFAULT`
        const fallbackStock = typeof product.stock === 'number' ? product.stock : 0
        
        inventories.push({
          productId: product._id,
          variantSku: fallbackSku,  // Use product.sku or generate default
          available: fallbackStock,  // Lấy từ product.stock nếu có
          reserved: 0,
          sold: 0,
          damaged: 0,
          lastUpdated: new Date(),
        })

        if (typeof product.stock !== 'number') {
          console.warn(`⚠️  Product "${product.name}" has no variants and no stock; defaulting to 0 (SKU: ${fallbackSku})`)
        } else {
          console.warn(`⚠️  Product "${product.name}" has no variants, using fallback SKU: ${fallbackSku}`)
        }
      }
    }

    const createdInventories = await Inventory.create(inventories)

    console.log(`✓ Inventory seeded: ${createdInventories.length} entries created`)
    if (noVariantCount > 0) {
      console.log(`  ⚠️  ${noVariantCount} products had no variants (used fallback SKU)`)
    }
    return {
      created: createdInventories.length,
      noVariants: noVariantCount,
      message: `Inventory seeded: ${createdInventories.length} entries created (${noVariantCount} fallbacks)`,
    }
  } catch (error: any) {
    throw new Error(`Inventory seed error: ${error.message}`)
  }
}

// Run independently
const runDirectly = process.argv[1]?.includes('seedInventory')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')

      console.log('🌱 Seeding inventory...\n')
      const result = await seedInventory()

      console.log(`\n✅ Seed completed: ${result.created} inventory records created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
