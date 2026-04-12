import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from '../models/Product.js'
import Inventory from '../models/Inventory.js'
import Category from '../models/Category.js'
import connectDB from '../config/db.js'

dotenv.config()

// Helper function to generate SKU
function generateSKU(baseSKU: string, variantIndex: number, suffix: string = ''): string {
  const timestamp = Date.now().toString().slice(-4)
  return `${baseSKU}-V${variantIndex}-${timestamp}${suffix ? `-${suffix}` : ''}`.toUpperCase()
}

// Variants data for different product types
const VARIANT_CONFIGS: Record<string, { count: number; variants: Array<{ name: string; attributes: Record<string, any>; priceMultiplier: number }> }> = {
  game: {
    count: 10,
    variants: [
      { name: 'PS5 Standard Edition', attributes: { platform: 'PS5', edition: 'Standard' }, priceMultiplier: 1 },
      { name: 'PS5 Deluxe Edition', attributes: { platform: 'PS5', edition: 'Deluxe' }, priceMultiplier: 1.2 },
      { name: 'PS4 Standard', attributes: { platform: 'PS4', edition: 'Standard' }, priceMultiplier: 0.8 },
      { name: 'PC Standard', attributes: { platform: 'PC', edition: 'Standard' }, priceMultiplier: 0.9 },
      { name: 'Xbox Series X', attributes: { platform: 'Xbox Series X', edition: 'Standard' }, priceMultiplier: 1 },
      { name: 'Xbox Series S', attributes: { platform: 'Xbox Series S', edition: 'Standard' }, priceMultiplier: 0.85 },
      { name: 'Nintendo Switch', attributes: { platform: 'Nintendo Switch', edition: 'Standard' }, priceMultiplier: 0.75 },
      { name: 'Handheld PC', attributes: { platform: 'Handheld PC', edition: 'Standard' }, priceMultiplier: 1.1 },
      { name: 'Collector\'s Edition', attributes: { platform: 'Multi', edition: 'Collector' }, priceMultiplier: 1.5 },
      { name: 'Digital Edition', attributes: { platform: 'Multi', edition: 'Digital' }, priceMultiplier: 0.95 },
    ],
  },
  'may-game': { // Máy Game
    count: 5,
    variants: [
      { name: 'Black Edition', attributes: { color: 'Black', edition: 'Standard' }, priceMultiplier: 1 },
      { name: 'White Edition', attributes: { color: 'White', edition: 'Standard' }, priceMultiplier: 1 },
      { name: 'Grey Edition', attributes: { color: 'Grey', edition: 'Limited' }, priceMultiplier: 1.1 },
      { name: 'Silver Limited', attributes: { color: 'Silver', edition: 'Limited' }, priceMultiplier: 1.15 },
      { name: 'Gold Premium', attributes: { color: 'Gold', edition: 'Premium' }, priceMultiplier: 1.25 },
    ],
  },
  'phu-kien': { // Phụ kiện
    count: 7,
    variants: [
      { name: 'Standard Pack', attributes: { type: 'Standard' }, priceMultiplier: 1 },
      { name: 'Premium Pack', attributes: { type: 'Premium' }, priceMultiplier: 1.2 },
      { name: 'Deluxe Pack', attributes: { type: 'Deluxe' }, priceMultiplier: 1.5 },
      { name: 'Starter Kit', attributes: { type: 'Starter' }, priceMultiplier: 0.7 },
      { name: 'Professional', attributes: { type: 'Professional' }, priceMultiplier: 1.8 },
      { name: 'Bundle Pack', attributes: { type: 'Bundle' }, priceMultiplier: 2 },
      { name: 'Economy Pack', attributes: { type: 'Economy' }, priceMultiplier: 0.6 },
    ],
  },
  'controller': {
    count: 6,
    variants: [
      { name: 'Wireless', attributes: { type: 'Wireless' }, priceMultiplier: 1 },
      { name: 'Wired', attributes: { type: 'Wired' }, priceMultiplier: 0.85 },
      { name: 'Pro Version', attributes: { type: 'Pro' }, priceMultiplier: 1.3 },
      { name: 'Limited Edition', attributes: { type: 'Limited' }, priceMultiplier: 1.4 },
      { name: 'RGB Gaming', attributes: { type: 'RGB' }, priceMultiplier: 1.5 },
      { name: 'Budget', attributes: { type: 'Budget' }, priceMultiplier: 0.7 },
    ],
  },
  'headset': {
    count: 6,
    variants: [
      { name: 'Stereo Standard', attributes: { type: 'Stereo' }, priceMultiplier: 1 },
      { name: '7.1 Surround', attributes: { type: 'Surround' }, priceMultiplier: 1.2 },
      { name: 'Wireless Pro', attributes: { type: 'Wireless Pro' }, priceMultiplier: 1.5 },
      { name: 'Noise Canceling', attributes: { type: 'NC' }, priceMultiplier: 1.4 },
      { name: 'Budget', attributes: { type: 'Budget' }, priceMultiplier: 0.75 },
      { name: 'Premium', attributes: { type: 'Premium' }, priceMultiplier: 1.8 },
    ],
  },
}

export const seedSmartVariants = async () => {
  try {
    await connectDB()
    console.log('📦 Starting smart variant seeding...\n')

    // Fetch all categories to map ID -> slug
    const categories = await Category.find({}).lean()
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat.slug]))
    console.log(`✓ Loaded ${categories.length} categories\n`)

    // ✅ ONLY get base products (isBaseProduct: true) to avoid exponential cloning
    const existingProducts = await Product.find({ isBaseProduct: true, isActive: true }).lean()
    console.log(`Found ${existingProducts.length} BASE products to clone\n`)

    if (existingProducts.length === 0) {
      console.error('❌ No base products found. Please mark products with "isBaseProduct: true" first.')
      console.error('   You can use: await Product.updateMany({ _id: { $in: [id1, id2, ...] } }, { isBaseProduct: true })')
      process.exit(1)
    }

    let totalCreated = 0
    let totalInventoryCreated = 0
    const createdProducts: any[] = []

    // Process each existing product
    for (const baseProduct of existingProducts) {
      // Get category slug from ID
      const categorySlug = categoryMap.get(baseProduct.categoryId?.toString() || '')
      
      // Determine variant config based on category slug
      let variantConfig = VARIANT_CONFIGS['phu-kien'] // default
      let productType = 'phu-kien'

      if (categorySlug === 'game') {
        variantConfig = VARIANT_CONFIGS.game
        productType = 'game'
      } else if (categorySlug === 'may-game') {
        variantConfig = VARIANT_CONFIGS['may-game']
        productType = 'may-game'
      } else if (categorySlug === 'controller') {
        variantConfig = VARIANT_CONFIGS.controller
        productType = 'controller'
      } else if (categorySlug === 'headset') {
        variantConfig = VARIANT_CONFIGS.headset
        productType = 'headset'
      }

      const variantCount = variantConfig.count

      console.log(`\n🔄 Processing: ${baseProduct.name}`)
      console.log(`   Category: ${categorySlug} | Type: ${productType} | Creating ${variantCount} variants`)

      // Create cloned products with variants
      for (let i = 0; i < variantCount; i++) {
        const variantData = variantConfig.variants[i % variantConfig.variants.length]
        const baseSku = baseProduct.sku || `PROD-${Date.now()}`
        const newSku = generateSKU(baseSku, i + 1, productType.substring(0, 1).toUpperCase())
        const basePrice = baseProduct.price || 299000 // Default price if not set
        const baseCost = baseProduct.cost || basePrice * 0.6

        try {
          // Tạo array variants cho product này (mỗi product có 2-3 variants)
          const variantsArray = []
          const numVariantsPerProduct = Math.min(3, variantCount - i) // 2-3 variants per product
          
          for (let v = 0; v < numVariantsPerProduct && (i + v) < variantCount; v++) {
            const vData = variantConfig.variants[(i + v) % variantConfig.variants.length]
            const vSku = generateSKU(baseSku, i + v + 1, productType.substring(0, 1).toUpperCase())
            
            variantsArray.push({
              sku: vSku,
              name: vData.name,
              attributes: vData.attributes,
              price: Math.ceil(basePrice * vData.priceMultiplier),
              cost: Math.ceil(baseCost * vData.priceMultiplier),
              discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0,
              finalPrice: 0,
              stock: Math.floor(Math.random() * 100) + 10,
              status: 'active',
            })
          }

          // Calculate finalPrice cho tất cả variants
          variantsArray.forEach(variant => {
            variant.finalPrice = Math.round(variant.price * (1 - variant.discount / 100))
          })

          // Create new product with multiple variants
          const newProduct = new Product({
            name: `${baseProduct.name} - ${variantsArray.map(v => v.name).join(' / ')}`,
            slug: `${baseProduct.slug}-${variantsArray.map(v => v.name.toLowerCase().replace(/\s+/g, '-')).join('-')}-${i}`,
            description: baseProduct.description || `${baseProduct.name}`,
            sku: newSku,
            categoryId: baseProduct.categoryId,
            brand: baseProduct.brand,
            platforms: baseProduct.platforms,
            genres: baseProduct.genres,
            
            // Product-level pricing (fallback)
            price: Math.min(...variantsArray.map(v => v.price)),
            cost: Math.min(...variantsArray.map(v => v.cost)),
            discount: 0,
            minPrice: Math.min(...variantsArray.map(v => v.price)),
            maxPrice: Math.max(...variantsArray.map(v => v.price)),
            
            // ✅ Copy ALL related fields from base product
            images: baseProduct.images || [],
            specifications: baseProduct.specifications,
            videoTrailerUrl: baseProduct.videoTrailerUrl,
            tags: baseProduct.tags || [],
            multiplayer: baseProduct.multiplayer,
            
            isActive: true,
            isBaseProduct: false,  // ✅ Cloned products are NOT base products
            views: 0,
            ratingCount: Math.floor(Math.random() * 50),
            ratingAverage: Math.random() > 0.3 ? 3.5 + Math.random() * 1.5 : 0,
            soldCount: Math.floor(Math.random() * 100),
            
            // Add all variants
            variants: variantsArray,
          })

          const savedProduct = await newProduct.save()
          createdProducts.push(savedProduct)
          totalCreated++

          // Create inventory records for product-level (without variant)
          const productInventory = new Inventory({
            productId: savedProduct._id,
            variantSku: null, // Product-level inventory
            available: Math.floor(Math.random() * 50) + 20,
            reserved: Math.floor(Math.random() * 10) + 2,
            sold: Math.floor(Math.random() * 20) + 5,
            damaged: Math.floor(Math.random() * 5) + 1,
          })
          await productInventory.save()
          totalInventoryCreated++

          // Create inventory records for each variant
          for (const variant of variantsArray) {
            const variantInventory = new Inventory({
              productId: savedProduct._id,
              variantSku: variant.sku,
              available: Math.floor(variant.stock * 0.8),
              reserved: Math.floor(variant.stock * 0.1),
              sold: Math.floor(variant.stock * 0.08),
              damaged: Math.floor(variant.stock * 0.02),
            })
            await variantInventory.save()
            totalInventoryCreated++
          }

          console.log(`   ✓ Created: ${newProduct.name}`)
          console.log(`      Variants: ${variantsArray.map(v => v.name).join(', ')}`)
          console.log(`      SKUs: ${variantsArray.map(v => v.sku).join(', ')}`)
          console.log(`      Inventory records created: ${variantsArray.length + 1}`)
          
          // Skip forward by number of variants we already processed
          i += numVariantsPerProduct - 1
        } catch (error) {
          console.error(`   ✗ Error creating product: ${(error as any).message}`)
        }
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ Smart Variant Seeding Complete!')
    console.log('='.repeat(70))
    console.log(`\n📊 Summary:`)
    console.log(`   Base products used: ${existingProducts.length}`)
    console.log(`   New cloned products created: ${totalCreated}`)
    console.log(`   Total products in DB (approx): ${totalCreated} new + existing`)
    console.log(`   Inventory records created: ${totalInventoryCreated}`)
    
    // Calculate breakdown by category
    console.log(`\n📈 SKU Distribution by Category:`)
    const categoryBreakdown = new Map<string, number>()
    
    for (const product of existingProducts) {
      const slug = categoryMap.get(product.categoryId?.toString() || '')
      const config = VARIANT_CONFIGS[slug as keyof typeof VARIANT_CONFIGS] || VARIANT_CONFIGS['phu-kien']
      const count = categoryBreakdown.get(slug || 'unknown') || 0
      categoryBreakdown.set(slug || 'unknown', count + config.count)
    }

    categoryBreakdown.forEach((count, slug) => {
      console.log(`   ${slug}: ${count} SKUs`)
    })

    console.log(`\n   Total new SKUs: ${totalCreated}`)
    console.log('\n✨ Database is ready for testing!\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', (error as any).message)
    process.exit(1)
  }
}

// Run seeding
seedSmartVariants()
